"use client"

import { LoginForm } from "@/components/custom/login-form"
import Image from "next/image"
import Link from "next/link"

export default function Login() {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <Link href="/" className="flex items-center gap-2 font-medium">
                        <Image
                            src="https://storesignal.ai/wp-content/uploads/2026/01/final-logo-dark-1.svg"
                            alt="StoreSignal AI"
                            width={200}
                            height={20}
                            loading="eager"
                        />
                    </Link>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <LoginForm />
                    </div>
                </div>
            </div>
            <div className="relative hidden bg-muted lg:block">
                <Image
                    src="/frame_934.svg"
                    alt="Image"
                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                    width={800}
                    height={600}
                />
            </div>
        </div>
    )
}
