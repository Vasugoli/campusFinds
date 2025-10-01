#!/usr/bin/env -S deno run --allow-all

import { connectDB } from "../server/src/database.ts";
import { User } from "../server/src/models/User.ts";
import { Item } from "../server/src/models/Item.ts";

console.log("🌱 Starting database seeding...");

// Connect to database
await connectDB();

// Clear existing data (be careful in production!)
console.log("🧹 Clearing existing data...");
await Promise.all([User.deleteMany({}), Item.deleteMany({})]);

// Create sample users
console.log("👥 Creating sample users...");
const users = await User.create([
	{
		displayName: "Admin User",
		email: "admin@university.edu",
		password: "admin123",
		rollNo: "ADM001",
		role: "admin",
		phone: "+1-555-0001",
	},
	{
		displayName: "John Smith",
		email: "john.smith@university.edu",
		password: "password123",
		rollNo: "CS2021001",
		phone: "+1-555-0101",
	},
	{
		displayName: "Emily Davis",
		email: "emily.davis@university.edu",
		password: "password123",
		rollNo: "EE2021002",
		phone: "+1-555-0102",
	},
	{
		displayName: "Michael Johnson",
		email: "michael.johnson@university.edu",
		password: "password123",
		rollNo: "ME2021003",
		phone: "+1-555-0103",
	},
]);

console.log(`✅ Created ${users.length} users`);

// Create sample items
console.log("📱 Creating sample items...");
const items = await Item.create([
	{
		title: "iPhone 13 Pro - Black",
		description:
			"Lost my iPhone 13 Pro in black color near the library. It has a cracked screen protector and a blue case.",
		category: "Electronics",
		location: "Main Library - 2nd Floor",
		status: "lost",
		reporterId: users[1]._id,
		tags: ["phone", "black", "case", "cracked"],
		searchKeywords: [
			"iPhone",
			"13",
			"Pro",
			"black",
			"phone",
			"library",
			"cracked",
			"case",
		],
	},
	{
		title: "Blue Backpack with Laptop",
		description:
			"Found a blue JanSport backpack containing a Dell laptop, some textbooks, and personal items.",
		category: "Bags",
		location: "Engineering Building - Entrance",
		status: "found",
		reporterId: users[2]._id,
		tags: ["backpack", "blue", "laptop", "textbooks"],
		searchKeywords: [
			"backpack",
			"blue",
			"JanSport",
			"laptop",
			"Dell",
			"engineering",
			"textbooks",
		],
	},
	{
		title: "Gold Bracelet",
		description:
			"Lost my grandmother's gold bracelet in the cafeteria area. It has small flower engravings.",
		category: "Jewelry",
		location: "Student Cafeteria",
		status: "lost",
		reporterId: users[3]._id,
		tags: ["gold", "bracelet", "flowers", "sentimental"],
		searchKeywords: [
			"bracelet",
			"gold",
			"flower",
			"engravings",
			"cafeteria",
			"grandmother",
		],
	},
	{
		title: "Calculus Textbook - 8th Edition",
		description:
			"Found a Calculus textbook (8th edition) by James Stewart. Has some notes and highlighting inside.",
		category: "Books",
		location: "Mathematics Building - Room 201",
		status: "found",
		reporterId: users[0]._id,
		tags: ["textbook", "calculus", "mathematics", "notes"],
		searchKeywords: [
			"calculus",
			"textbook",
			"James",
			"Stewart",
			"mathematics",
			"notes",
			"highlighting",
		],
	},
]);

console.log(`✅ Created ${items.length} items`);

console.log("\n🎉 Database seeding completed successfully!");
console.log("\n📊 Summary:");
console.log(`   👥 Users: ${users.length}`);
console.log(`   📱 Items: ${items.length}`);
console.log(`\n🔐 Test Credentials:`);
console.log(`   Admin: admin@university.edu / admin123`);
console.log(`   User: john.smith@university.edu / password123`);

console.log("\n🚀 You can now start the server with: deno task dev");
