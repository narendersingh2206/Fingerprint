import { join } from 'node:path';
import { Low, JSONFile } from 'lowdb';

type Data = {
    users: { id: string; name: string; userId: string; password: string }[];
    devices: { id: string; deviceId: string; userId: string, lastUsed: Date, registeredOn: Date }[];
}

const file = join(process.cwd(), 'db.json');
const adapter = new JSONFile<Data>(file);
const db = new Low<Data>(adapter);

await db.read();
db.data ||= { users: [], devices: [] };

export const store = {
    getUsers: () => db.data ? db.data.users : [],
    addUser: async (user: {name: string; userId: string; password: string}) => {
        const id = String(Math.random().toString(36).substring(2, 15)); // Simple ID generation
        const newUser = { id, ...user };
        db.data = db.data || { users: [], devices: [] };
        db.data.users.push(newUser);
        await db.write();
    },
    clearUsers: async () => {
        db.data = db.data || { users: [], devices: [] };
        db.data.users = [];
        await db.write();
    },
    getDevices: () => db.data ? db.data.devices : [],
    addDevice: async (device: {deviceId: string; userId: string}) => {
        db.data = db.data || { users: [], devices: [] };
        const id = String(Math.random().toString(36).substring(2, 15)); // Simple ID generation
        const newDevice = { id, ...device, lastUsed: new Date(), registeredOn: new Date() };
        db.data.devices.push(newDevice);
        await db.write();
    },
    updateDevice: async (id: string, updates: Partial<{deviceId: string; userId: string; lastUsed: Date; registeredOn: Date}>) => {
        db.data = db.data || { users: [], devices: [] };
        const deviceIndex = db.data.devices.findIndex(device => device.id === id);
        if (deviceIndex !== -1) {
            db.data.devices[deviceIndex] = { ...db.data.devices[deviceIndex], ...updates };
            await db.write();
        }
    },
    removeDevice: async (id: string) => {
        db.data = db.data || { users: [], devices: [] };
        db.data.devices = db.data.devices.filter(device => device.id !== id);
        await db.write();
    }
};
export default store;
export type Store = typeof store;