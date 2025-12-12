import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-goldenrod/5 dark:bg-dark-brown flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    {/* Left: Cover Image (35%) */}
                    <div className="md:col-span-4 flex justify-center">
                        <div className="relative w-full max-w-md">
                            <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden shadow-2xl border-4 border-goldenrod/20 transition-all hover:scale-105 cursor-pointer">
                                <Image
                                    src="/images/cover.jpg"
                                    alt="Physical AI & Humanoid Robotics Book Cover"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Title and Description (65%) */}
                    <div className="md:col-span-8 space-y-6">
                        <div>
                            <h1 className="text-5xl md:text-6xl font-bold text-dark-brown dark:text-cream mb-4 leading-tight text-center">
                                Physical AI & <br />
                                Humanoid Robotics
                            </h1>
                            <div className="h-1 w-32 bg-goldenrod rounded-full mb-6 mx-auto"></div>
                        </div>

                        <div className="space-y-4 text-lg text-dark-brown/80 dark:text-cream/80">
                            <div className="bg-cream/50 dark:bg-dark-brown/30 p-6 rounded-lg border-l-4 border-goldenrod">
                                <h2 className="text-2xl font-semibold text-dark-brown dark:text-cream mb-3">
                                    Focus and Theme
                                </h2>
                                <p className="leading-relaxed">
                                    <span className="font-semibold text-goldenrod">AI Systems in the Physical World.</span>{" "}
                                    Embodied Intelligence.
                                </p>
                            </div>

                            <div className="bg-mint/10 dark:bg-mint/5 p-6 rounded-lg border-l-4 border-mint">
                                <h2 className="text-2xl font-semibold text-dark-brown dark:text-cream mb-3">
                                    Goal
                                </h2>
                                <p className="leading-relaxed">
                                    Bridging the gap between the digital brain and the physical body.
                                    Students apply their AI knowledge to control{" "}
                                    <span className="font-semibold text-mint dark:text-mint">Humanoid Robots</span>{" "}
                                    in simulated and real-world environments.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link
                                href="/book"
                                className="inline-flex items-center justify-center px-8 py-4 bg-goldenrod hover:bg-goldenrod/90 text-dark-brown font-bold text-lg rounded-lg shadow-lg transition-all hover:scale-105"
                            >
                                Start Reading
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 ml-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                                    />
                                </svg>
                            </Link>
                            <Link
                                href="/signup"
                                className="inline-flex items-center justify-center px-8 py-4 bg-mint hover:bg-mint/90 text-white font-bold text-lg rounded-lg shadow-lg transition-all hover:scale-105"
                            >
                                Create Account
                            </Link>
                        </div>

                        <p className="text-sm text-dark-brown/60 dark:text-cream/60 italic">
                            By Rubaiya Kamal
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
