import { Form, data, redirect, useActionData } from "@remix-run/react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

import store from "~/store/store.server";
import { ActionFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { userSession } from "~/lib/cookies.server";

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
    const username = formData.get("username") as string || "";
    const password = formData.get("password") as string || "";
    const name = formData.get("name") as string || "";
    if (!username || !password || !name) {
        return new Response("All fields are required", { status: 400 });
    }

    // Here you would typically handle the login logic, e.g., checking credentials
    const user = store.getUsers().find(user => user.userId === username);
    if (user) {
        return new Response("User exists", { status: 401 });
    }
    await store.addUser({ name, userId: username, password });

    // Redirect or return a response
    return redirect("/login");
}

export default function Register() {
    const actionData = useActionData<typeof action>();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-4xl text-blue-400">Login Page</h1>
            <p className="text-black">Please enter your credentials to log in.</p>
            <Form method="POST" className="mt-4">
                {/* <input type="hidden" name="visitorData" defaultValue={JSON.stringify(data)} /> */}
                <Input
                    type="text"
                    placeholder="Name"
                    name="name"
                    required
                    className="mb-2 p-2 border rounded"
                />
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
                    Register
                </Button>
            </Form>
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