import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import {
    Gender,
    PrismaClient,
    RideStatus,
    Role,
    Status,
} from "../generated/prisma/index.js";

const connectionString = process.env.NEON_DB_URL ?? process.env.DIRECT_URL;

if (!connectionString) {
    throw new Error("Missing NEON_DB_URL or DIRECT_URL environment variable");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        console.log("Cleaning existing data...");
        await prisma.booking.deleteMany();
        await prisma.ride.deleteMany();
        await prisma.user.deleteMany();
        console.log("Data cleanup complete.");

        console.log("Seeding users...");
        const hashedPassword = await bcrypt.hash("password123", 10);

        const usersData = [
            {
                fullName: "Youcef Bensalem",
                email: "youcef@test.com",
                phone: "0551234567",
                gender: Gender.MALE,
                role: Role.DRIVER,
                avatar: "https://i.pravatar.cc/150?img=11",
                password: hashedPassword,
            },
            {
                fullName: "Amira Hadj",
                email: "amira@test.com",
                phone: "0662345678",
                gender: Gender.FEMALE,
                role: Role.DRIVER,
                avatar: "https://i.pravatar.cc/150?img=20",
                password: hashedPassword,
            },
            {
                fullName: "Karim Meziani",
                email: "karim@test.com",
                phone: "0773456789",
                gender: Gender.MALE,
                role: Role.DRIVER,
                avatar: "https://i.pravatar.cc/150?img=31",
                password: hashedPassword,
            },
            {
                fullName: "Sonia Belkacem",
                email: "sonia@test.com",
                phone: "0554567890",
                gender: Gender.FEMALE,
                role: Role.PASSENGER,
                avatar: "https://i.pravatar.cc/150?img=41",
                password: hashedPassword,
            },
            {
                fullName: "Rami Ouali",
                email: "rami@test.com",
                phone: "0665678901",
                gender: Gender.MALE,
                role: Role.PASSENGER,
                avatar: "https://i.pravatar.cc/150?img=52",
                password: hashedPassword,
            },
            {
                fullName: "Lina Ferhat",
                email: "lina@test.com",
                phone: "0776789012",
                gender: Gender.FEMALE,
                role: Role.PASSENGER,
                avatar: "https://i.pravatar.cc/150?img=61",
                password: hashedPassword,
            },
            {
                fullName: "Omar Djebbar",
                email: "omar@test.com",
                phone: "0557890123",
                gender: Gender.MALE,
                role: Role.PASSENGER,
                avatar: "https://i.pravatar.cc/150?img=72",
                password: hashedPassword,
            },
        ];

        const userIdByEmail = new Map<string, number>();

        for (const userData of usersData) {
            const createdUser = await prisma.user.create({
                data: userData,
            });
            userIdByEmail.set(createdUser.email, createdUser.id);
            console.log(`Created user: ${createdUser.fullName} (${createdUser.role})`);
        }

        console.log("Users seeded.");

        console.log("Seeding rides...");
        const ridesData = [
            {
                key: "alger_oran_active",
                driverEmail: "youcef@test.com",
                origin: "Alger",
                destination: "Oran",
                departure: new Date("2026-07-12T08:30:00.000Z"),
                price: "1200",
                seats: 3,
                status: RideStatus.ACTIVE,
            },
            {
                key: "oran_constantine_full",
                driverEmail: "amira@test.com",
                origin: "Oran",
                destination: "Constantine",
                departure: new Date("2026-08-02T06:45:00.000Z"),
                price: "1800",
                seats: 3,
                status: RideStatus.FULL,
            },
            {
                key: "alger_annaba_active",
                driverEmail: "karim@test.com",
                origin: "Alger",
                destination: "Annaba",
                departure: new Date("2026-09-10T05:50:00.000Z"),
                price: "1700",
                seats: 2,
                status: RideStatus.ACTIVE,
            },
            {
                key: "constantine_setif_active",
                driverEmail: "amira@test.com",
                origin: "Constantine",
                destination: "Setif",
                departure: new Date("2026-10-15T14:00:00.000Z"),
                price: "900",
                seats: 4,
                status: RideStatus.ACTIVE,
            },
            {
                key: "blida_alger_cancelled",
                driverEmail: "youcef@test.com",
                origin: "Blida",
                destination: "Alger",
                departure: new Date("2026-11-20T07:10:00.000Z"),
                price: "600",
                seats: 3,
                status: RideStatus.CANCELLED,
            },
            {
                key: "tizi_alger_completed",
                driverEmail: "karim@test.com",
                origin: "Tizi Ouzou",
                destination: "Alger",
                departure: new Date("2026-12-05T09:00:00.000Z"),
                price: "700",
                seats: 2,
                status: RideStatus.COMPLETED,
            },
            {
                key: "oran_alger_active",
                driverEmail: "youcef@test.com",
                origin: "Oran",
                destination: "Alger",
                departure: new Date("2027-01-11T12:20:00.000Z"),
                price: "1300",
                seats: 1,
                status: RideStatus.ACTIVE,
            },
            {
                key: "alger_tlemcen_active",
                driverEmail: "amira@test.com",
                origin: "Alger",
                destination: "Tlemcen",
                departure: new Date("2027-02-14T04:55:00.000Z"),
                price: "2000",
                seats: 4,
                status: RideStatus.ACTIVE,
            },
        ];

        const rideIdByKey = new Map<string, number>();

        for (const rideData of ridesData) {
            const driverId = userIdByEmail.get(rideData.driverEmail);
            if (!driverId) {
                throw new Error(`Missing driver user for ${rideData.driverEmail}`);
            }

            const createdRide = await prisma.ride.create({
                data: {
                    driverId,
                    origin: rideData.origin,
                    destination: rideData.destination,
                    departure: rideData.departure,
                    price: rideData.price,
                    seats: rideData.seats,
                    status: rideData.status,
                },
            });

            rideIdByKey.set(rideData.key, createdRide.id);
            console.log(
                `Created ride: ${rideData.origin} -> ${rideData.destination} (${rideData.status})`,
            );
        }

        console.log("Rides seeded.");

        console.log("Validating booking constraints...");
        const bookingsData = [
            {
                rideKey: "oran_constantine_full",
                passengerEmail: "sonia@test.com",
                status: Status.CONFIRMED,
            },
            {
                rideKey: "oran_constantine_full",
                passengerEmail: "rami@test.com",
                status: Status.CONFIRMED,
            },
            {
                rideKey: "oran_constantine_full",
                passengerEmail: "lina@test.com",
                status: Status.CONFIRMED,
            },
            {
                rideKey: "alger_oran_active",
                passengerEmail: "omar@test.com",
                status: Status.CONFIRMED,
            },
            {
                rideKey: "alger_annaba_active",
                passengerEmail: "sonia@test.com",
                status: Status.CONFIRMED,
            },
            {
                rideKey: "constantine_setif_active",
                passengerEmail: "rami@test.com",
                status: Status.CONFIRMED,
            },
            {
                rideKey: "alger_tlemcen_active",
                passengerEmail: "lina@test.com",
                status: Status.CONFIRMED,
            },
            {
                rideKey: "tizi_alger_completed",
                passengerEmail: "omar@test.com",
                status: Status.CANCELLED,
            },
        ];

        const fullRide = ridesData.find((ride) => ride.status === RideStatus.FULL);
        if (!fullRide) {
            throw new Error("A FULL ride is required for booking validation");
        }

        const fullRideBookingsCount = bookingsData.filter(
            (booking) =>
                booking.rideKey === fullRide.key && booking.status === Status.CONFIRMED,
        ).length;

        if (fullRideBookingsCount !== fullRide.seats) {
            throw new Error(
                `FULL ride seats (${fullRide.seats}) must match confirmed bookings (${fullRideBookingsCount})`,
            );
        }

        const bookingPairSet = new Set<string>();
        for (const booking of bookingsData) {
            const pairKey = `${booking.rideKey}:${booking.passengerEmail}`;
            if (bookingPairSet.has(pairKey)) {
                throw new Error(`Duplicate booking detected for ${pairKey}`);
            }
            bookingPairSet.add(pairKey);

            const ride = ridesData.find((item) => item.key === booking.rideKey);
            if (!ride) {
                throw new Error(`Missing ride ${booking.rideKey} for booking validation`);
            }

            if (ride.driverEmail === booking.passengerEmail) {
                throw new Error(
                    `Passenger cannot book own ride (${booking.passengerEmail} on ${booking.rideKey})`,
                );
            }
        }

        console.log("Booking constraints validated.");

        console.log("Seeding bookings...");
        for (const bookingData of bookingsData) {
            const rideId = rideIdByKey.get(bookingData.rideKey);
            const passengerId = userIdByEmail.get(bookingData.passengerEmail);

            if (!rideId) {
                throw new Error(`Missing ride for key ${bookingData.rideKey}`);
            }

            if (!passengerId) {
                throw new Error(`Missing passenger for ${bookingData.passengerEmail}`);
            }

            const createdBooking = await prisma.booking.create({
                data: {
                    rideId,
                    passengerId,
                    status: bookingData.status,
                },
            });

            console.log(
                `Created booking #${createdBooking.id}: ${bookingData.passengerEmail} -> ${bookingData.rideKey} (${bookingData.status})`,
            );
        }

        console.log("Bookings seeded.");
        console.log("Wasselni seed completed successfully.");
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
        console.log("Prisma disconnected.");
    }
}

main();
