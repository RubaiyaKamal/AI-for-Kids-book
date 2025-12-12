import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
    const { siteConfig } = useDocusaurusContext();
    return (
        <header className={clsx('hero', styles.heroBanner)}>
            <div className={styles.heroContainer}>
                <div className={styles.imageSection}>
                    <img
                        src="/Book-for-project-hackathon/img/book-cover.jpg"
                        alt="Physical AI & Humanoid Robotics Book Cover"
                        className={styles.bookCover}
                    />
                </div>
                <div className={styles.contentSection}>
                    <Heading as="h1" className={styles.heroTitle}>
                        Physical AI & Humanoid Robotics
                    </Heading>
                    <div className={styles.heroDescription}>
                        <p className={styles.descriptionItem}>
                            <strong>Focus and Theme:</strong> AI Systems in the Physical World. Embodied Intelligence.
                        </p>
                        <p className={styles.descriptionItem}>
                            <strong>Goal:</strong> Bridging the gap between the digital brain and the physical body.
                        </p>
                        <p className={styles.descriptionItem}>
                            Students apply their AI knowledge to control Humanoid Robots in simulated and real-world environments.
                        </p>
                    </div>
                    <div className={styles.buttons}>
                        <Link
                            className="button button--primary button--lg"
                            to="/docs/intro">
                            Get Started →
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default function Home(): JSX.Element {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout
            title={`${siteConfig.title}`}
            description="Bridging the Gap Between Digital AI and Embodied Intelligence">
            <HomepageHeader />
        </Layout>
    );
}
