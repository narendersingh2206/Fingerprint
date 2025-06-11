import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { userSession } from "~/lib/cookies.server";

export const meta: MetaFunction = () => {
    return [
        { title: "Lebara" }
    ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
    // This loader can be used to fetch initial data if needed
    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await userSession.parse(cookieHeader)) || {};
    const userId = cookie.userId;
    if (userId) {
        // If user is already logged in, redirect to the dashboard
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/dashboard"
            },
        });
    }
    return {};
}

export default function Index() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-7xl text-blue-400">Welcome to Lebara</h1>
            <p className="text-black">This is a demo application to test FingerprintJS device registration.</p>
            <Link to="/login" className="mt-4">
                <Button size="lg">Login</Button>
            </Link>
        </div>
    );
}

