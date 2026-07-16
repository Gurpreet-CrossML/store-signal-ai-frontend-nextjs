import { Suspense } from "react";
import { redirect, RedirectType } from 'next/navigation'

export const metadata = {
    title: "Brand Voice",
};

export default function Page() {
    // redirect any landing person to Persona Identity page, as it is the first step in the Brand Voice setup.

    redirect('/brand-voice/persona-identity', RedirectType.replace)
    return (
        <Suspense fallback={null}>
            <></>
        </Suspense>
    );
}
