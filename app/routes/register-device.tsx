import { ActionFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { userSession, visitorDataCookie } from "~/lib/cookies.server";
import store from "~/store/store.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await visitorDataCookie.parse(cookieHeader)) || {};
    const userId = cookie.userId;
    const visitorData = cookie.visitorData;
    const user = store.getUsers().find(user => user.id === userId);
    if (!user || !visitorData) {
        // If no userId is found in the cookie, redirect to the login page
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/login",
            },
        });
    }
    let parsedVisitorData;
    try {
        parsedVisitorData = JSON.parse(visitorData);
    } catch (error) {
        return new Response("Invalid visitor data format", { status: 302, headers: { Location: "/" } });
    }
    const device = store.getDevices().find(device => device.userId === userId && device.deviceId === parsedVisitorData.visitorId);
    if (user && device) {
        // If user is already logged in and has devices, redirect to the dashboard

        return new Response(null, {
            status: 302,
            headers: {
                Location: "/dashboard",
                "Set-Cookie": await userSession.serialize({
                    userId: user.id,
                    deviceId: device.deviceId,
                }) + await visitorDataCookie.serialize(null),
            },
        });
    }
    // This loader can be used to fetch initial data if needed
    return {
        user,
        visitorData: visitorData ? String(visitorData) : "",
    };
}

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    if (formData.get("action") === "cancel") {
        // If the action is cancel, redirect to the login page
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/",
                "Set-Cookie": await visitorDataCookie.serialize(null),
            },
        });
    }
    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await visitorDataCookie.parse(cookieHeader)) || {};
    const userId = cookie.userId;
    const visitorData = JSON.parse(cookie.visitorData);

    const user = store.getUsers().find(user => user.id === userId);
    if (!user) {
        // If no user is found, redirect to the login page
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/login",
                "Set-Cookie": await visitorDataCookie.serialize(null),
            },
        });
    }

    // Register the device
    await store.addDevice({ userId, deviceId: visitorData.visitorId });

    // Redirect to the dashboard after registering the device
    return new Response(null, {
        status: 302,
        headers: {
            Location: "/dashboard",
            "Set-Cookie": await userSession.serialize({
                userId,
                deviceId: visitorData.visitorId
            }) + await visitorDataCookie.serialize(null),
        },
    });
}

export default function RegisterDevice() {
    const loaderData = useLoaderData<typeof loader>();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-7xl text-blue-400">Register Device</h1>
            <p className="text-black">This is the register device page of the Lebara application.</p>
            <p className="text-black">You are seeing this page as your device is not registered with us. Would you like to register this device?</p>
            <Form method="POST" className="mt-4">
                <input type="hidden" name="action" defaultValue="register-device" />
                <input type="hidden" name="visitorData" value={loaderData.visitorData} />                
                <Button type="submit" className="w-full">
                    Register Device
                </Button>
            </Form>
            <Separator className="my-4 w-full" />
            <Form method="POST" className="mt-4">
                <input type="hidden" name="action" defaultValue="cancel" />
                <Button type="submit" className="w-full">
                    Cancel
                </Button>
            </Form>
        </div>
    );
}