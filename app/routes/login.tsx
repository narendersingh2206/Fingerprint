import { ActionFunction, isCookie, LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, redirect, useActionData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useVisitorData } from '@fingerprintjs/fingerprintjs-pro-react'
import { useEffect } from "react";
import store from "~/store/store.server";
import { Separator } from "~/components/ui/separator";
import { userSession, visitorDataCookie } from "~/lib/cookies.server";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";


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
                Location: "/dashboard",
            },
        });
    }
    return {};
}

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const username = formData.get("username");
    const password = formData.get("password");
    const visitorData = formData.get("visitorData");
    if (!username || !password) {
        return new Response("Username and password are required", { status: 400 });
    }
    if (!visitorData) {
        return new Response("Visitor data is required", { status: 400 });
    }
    // Parse visitor data if it's a JSON string
    let parsedVisitorData;
    try {
        parsedVisitorData = JSON.parse(visitorData as string);
    } catch (error) {
        return new Response("Invalid visitor data format", { status: 400 });
    }

    // Here you would typically handle the login logic, e.g., checking credentials
    const user = store.getUsers().find(user => user.userId === username && user.password === password);
    if (!user) {
        return new Response("Invalid credentials or user does not exist", { status: 401 });
    }

    const devices = store.getDevices().filter(device => device.userId === user.id);
    if (devices.length > 0) {
        if (devices.find(device => device.deviceId === parsedVisitorData.visitorId)) {
            // If the device already exists, redirect to the dashboard
            const setCookie = await userSession.serialize({
                userId: user.id,
                deviceId: parsedVisitorData.visitorId
            });
            return new Response(null, {
                status: 302,
                headers: {
                    Location: "/dashboard",
                    "Set-Cookie": setCookie
                }
            });
        }
    }
    // Redirect or return a response
    return new Response(null, {
        status: 302,
        headers: {
            Location: "/register-device",
            "Set-Cookie": await visitorDataCookie.serialize({
                userId: user.id,
                visitorData: visitorData ? String(visitorData) : ""
            })
        }
    });
}

export default function Login() {
    const { isLoading, error, data, getData } = useVisitorData(
        { extendedResult: true },
        { immediate: true }
    )

    const actionData = useActionData<typeof action>();

    useEffect(() => {
        if (!data) {
            getData();
        }
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-4xl text-blue-400">Login Page</h1>
            <p className="text-black">Please enter your credentials to log in.</p>
            <Form method="POST" className="mt-4">
                <input type="hidden" name="visitorData" value={JSON.stringify(data)} onChange={() => console.log()} />
                <Input
                    type="text"
                    placeholder="Username"
                    name="username"
                    required
                    className="mb-2 p-2 border rounded"
                />
                <Input
                    type="password"
                    placeholder="Password"
                    name="password"
                    required
                    className="mb-4 p-2 border rounded"
                />
                <Button type="submit" className="w-full">
                    Login
                </Button>
            </Form>
            <Separator className="my-4 w-full" />
            <Link to="/register" className="text-blue-500 hover:underline">
                Don't have an account? Register here
            </Link>
            {actionData && (
                <Alert variant="destructive" className="mt-4 max-w-md">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {actionData}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}