import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-warm-white dark:bg-dark-brown py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-dark-brown dark:text-cream">
                    Join the Physical AI Course
                </h1>
                <p className="mt-2 text-dark-brown/70 dark:text-cream/70">
                    Start your journey into humanoid robotics
                </p>
            </div>
            <SignupForm />
        </div>
    );
}
