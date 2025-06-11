import { ActionFunction, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { userSession, visitorDataCookie } from "~/lib/cookies.server";
import store from "~/store/store.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await userSession.parse(cookieHeader)) || {};
    const userId = cookie.userId;
    const deviceId = cookie.deviceId;
    const user = store.getUsers().find(user => user.id === userId);
    const device = store.getDevices().find(device => device.deviceId === deviceId);
    if (!user || !device) {
        // If no userId is found in the cookie, redirect to the login page
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/",
                "Set-Cookie": await visitorDataCookie.serialize(null) + await userSession.serialize(null),
            },
        });
    }
    // This loader can be used to fetch data for the dashboard if needed
    return {
        user,
        device,
        message: "Welcome to the dashboard!",
    };
}

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const actionType = formData.get("action");

    if (actionType === "logout") {
        // Clear the user session cookie
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/",
                "Set-Cookie": await userSession.serialize(null),
            },
        });
    }

    // Handle other actions if needed
    return {};
}

export default function Dashboard() {
    const loaderData = useLoaderData<typeof loader>();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-7xl text-blue-400">Dashboard</h1>
            <p className="text-black">This is the dashboard page of the Lebara application. Welcome {loaderData.user.name}</p>
            <Form method="POST" className="mt-4">
                <input type="hidden" name="action" defaultValue="logout" />
                <Button type="submit" className="w-full">
                    Logout
                </Button>
            </Form>
        </div>
    );
}