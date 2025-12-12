from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import timedelta

import models, schemas, auth_utils
from database import get_db

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

@router.post("/signup", response_model=schemas.User)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed_password = auth_utils.get_password_hash(user.password)
        db_user = models.User(email=user.email, hashed_password=hashed_password)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # Create profile
        db_profile = models.UserProfile(
            user_id=db_user.id,
            software_experience=user.software_experience,
            hardware_experience=user.hardware_experience,
            interests=user.interests
        )
        db.add(db_profile)
        db.commit()

        return db_user
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    try:
        print(f"Login attempt for email: {user.email}")
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if not db_user:
            print(f"User not found: {user.email}")
            raise HTTPException(status_code=400, detail="Incorrect email or password")

        if not auth_utils.verify_password(user.password, db_user.hashed_password):
            print(f"Invalid password for user: {user.email}")
            raise HTTPException(status_code=400, detail="Incorrect email or password")

        access_token_expires = timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth_utils.create_access_token(
            data={"sub": db_user.email}, expires_delta=access_token_expires
        )
        print(f"Login successful for: {user.email}")
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth_utils.SECRET_KEY, algorithms=[auth_utils.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            print("Token validation failed: No email in payload")
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError as e:
        print(f"Token validation failed: {str(e)}")
        raise credentials_exception
    except Exception as e:
        print(f"Unexpected token validation error: {str(e)}")
        raise credentials_exception

    # Use joinedload to eager load the profile to prevent DetachedInstanceError
    user = db.query(models.User).options(joinedload(models.User.profile)).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    try:
        return current_user
    except Exception as e:
        print(f"Profile serialization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load profile: {str(e)}")
