"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    // Clear existing data
    await prisma.loan.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.item.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    console.log('🗑️  Cleared existing data');
    // Create admin user
    const adminPassword = await bcryptjs_1.default.hash('admin123', 10);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@ting.com',
            passwordHash: adminPassword,
            name: 'Admin User',
            role: 'ADMIN',
        },
    });
    // Create multiple test users
    const userPassword = await bcryptjs_1.default.hash('user123', 10);
    const users = await Promise.all([
        prisma.user.create({
            data: {
                email: 'user@ting.com',
                passwordHash: userPassword,
                name: 'Test User',
                role: 'MEMBER',
            },
        }),
        prisma.user.create({
            data: {
                email: 'emma@example.com',
                passwordHash: userPassword,
                name: 'Emma Hansen',
                role: 'MEMBER',
            },
        }),
        prisma.user.create({
            data: {
                email: 'lars@example.com',
                passwordHash: userPassword,
                name: 'Lars Nielsen',
                role: 'MEMBER',
            },
        }),
        prisma.user.create({
            data: {
                email: 'sofia@example.com',
                passwordHash: userPassword,
                name: 'Sofia Andersen',
                role: 'MEMBER',
            },
        }),
        prisma.user.create({
            data: {
                email: 'mikkel@example.com',
                passwordHash: userPassword,
                name: 'Mikkel Jensen',
                role: 'MEMBER',
            },
        }),
    ]);
    console.log('✅ Created admin and 5 users');
    // Create diverse categories
    const categories = {
        powerTools: await prisma.category.create({
            data: {
                id: 'cat-power-tools',
                name: 'Power Tools',
                description: 'Electric and battery-powered tools',
            },
        }),
        handTools: await prisma.category.create({
            data: {
                id: 'cat-hand-tools',
                name: 'Hand Tools',
                description: 'Manual tools and equipment',
            },
        }),
        gardening: await prisma.category.create({
            data: {
                id: 'cat-gardening',
                name: 'Gardening',
                description: 'Tools for outdoor and garden work',
            },
        }),
        camping: await prisma.category.create({
            data: {
                id: 'cat-camping',
                name: 'Camping & Outdoor',
                description: 'Camping gear and outdoor equipment',
            },
        }),
        sports: await prisma.category.create({
            data: {
                id: 'cat-sports',
                name: 'Sports Equipment',
                description: 'Sports and recreation equipment',
            },
        }),
        electronics: await prisma.category.create({
            data: {
                id: 'cat-electronics',
                name: 'Electronics',
                description: 'Cameras, projectors, and tech equipment',
            },
        }),
        party: await prisma.category.create({
            data: {
                id: 'cat-party',
                name: 'Party & Events',
                description: 'Party supplies and event equipment',
            },
        }),
        kitchen: await prisma.category.create({
            data: {
                id: 'cat-kitchen',
                name: 'Kitchen Appliances',
                description: 'Specialized kitchen equipment',
            },
        }),
    };
    console.log('✅ Created 8 categories');
    // Create many diverse items
    const items = await prisma.item.createMany({
        data: [
            // Power Tools (10 items)
            { name: 'Cordless Drill 18V', description: 'Milwaukee 18V cordless drill with 2 batteries and charger', categoryId: categories.powerTools.id, status: 'AVAILABLE' },
            { name: 'Circular Saw', description: '7-1/4" circular saw with laser guide and dust collection', categoryId: categories.powerTools.id, status: 'AVAILABLE' },
            { name: 'Jigsaw', description: 'Variable speed jigsaw with orbital action and LED light', categoryId: categories.powerTools.id, status: 'AVAILABLE' },
            { name: 'Impact Driver', description: '20V MAX impact driver with quick-change chuck', categoryId: categories.powerTools.id, status: 'AVAILABLE' },
            { name: 'Angle Grinder', description: '4.5" angle grinder with safety guard', categoryId: categories.powerTools.id, status: 'CHECKED_OUT' },
            { name: 'Random Orbital Sander', description: '5" sander with dust bag and multiple grits', categoryId: categories.powerTools.id, status: 'AVAILABLE' },
            { name: 'Router', description: 'Plunge router with variable speed control', categoryId: categories.powerTools.id, status: 'AVAILABLE' },
            { name: 'Nail Gun', description: 'Pneumatic brad nailer with carrying case', categoryId: categories.powerTools.id, status: 'AVAILABLE' },
            { name: 'Belt Sander', description: '3x21" belt sander with dust collection', categoryId: categories.powerTools.id, status: 'AVAILABLE' },
            { name: 'Miter Saw', description: '10" compound miter saw with laser guide', categoryId: categories.powerTools.id, status: 'AVAILABLE' },
            // Hand Tools (8 items)
            { name: 'Hammer Set', description: 'Claw hammer, rubber mallet, and ball-peen hammer', categoryId: categories.handTools.id, status: 'AVAILABLE' },
            { name: 'Screwdriver Set', description: '24-piece screwdriver set with magnetic tips', categoryId: categories.handTools.id, status: 'AVAILABLE' },
            { name: 'Socket Wrench Set', description: '108-piece socket and ratchet set with case', categoryId: categories.handTools.id, status: 'AVAILABLE' },
            { name: 'Pipe Wrench', description: '14" heavy-duty pipe wrench', categoryId: categories.handTools.id, status: 'AVAILABLE' },
            { name: 'Level Set', description: 'Torpedo level, 24" level, and laser level', categoryId: categories.handTools.id, status: 'AVAILABLE' },
            { name: 'Utility Knife Set', description: 'Retractable utility knives with extra blades', categoryId: categories.handTools.id, status: 'AVAILABLE' },
            { name: 'Pliers Set', description: 'Needle-nose, slip-joint, and locking pliers', categoryId: categories.handTools.id, status: 'CHECKED_OUT' },
            { name: 'Measuring Tape Set', description: '25ft and 12ft measuring tapes', categoryId: categories.handTools.id, status: 'AVAILABLE' },
            // Gardening (12 items)
            { name: 'Lawn Mower', description: 'Gas-powered self-propelled lawn mower', categoryId: categories.gardening.id, status: 'AVAILABLE' },
            { name: 'Hedge Trimmer', description: 'Electric hedge trimmer with 24" dual-action blade', categoryId: categories.gardening.id, status: 'AVAILABLE' },
            { name: 'Garden Tools Set', description: 'Shovel, rake, hoe, trowel, and hand fork', categoryId: categories.gardening.id, status: 'AVAILABLE' },
            { name: 'Leaf Blower', description: 'Gas-powered backpack leaf blower', categoryId: categories.gardening.id, status: 'AVAILABLE' },
            { name: 'Chainsaw', description: '16" gas chainsaw with safety gear', categoryId: categories.gardening.id, status: 'AVAILABLE' },
            { name: 'Pressure Washer', description: '2000 PSI electric pressure washer with attachments', categoryId: categories.gardening.id, status: 'CHECKED_OUT' },
            { name: 'Wheelbarrow', description: 'Heavy-duty steel wheelbarrow with pneumatic tire', categoryId: categories.gardening.id, status: 'AVAILABLE' },
            { name: 'Pruning Shears', description: 'Professional bypass pruning shears', categoryId: categories.gardening.id, status: 'AVAILABLE' },
            { name: 'Garden Hose & Reel', description: '100ft garden hose with wall-mount reel', categoryId: categories.gardening.id, status: 'AVAILABLE' },
            { name: 'Lawn Aerator', description: 'Manual spike lawn aerator', categoryId: categories.gardening.id, status: 'AVAILABLE' },
            { name: 'Tiller', description: 'Gas-powered garden tiller with adjustable tines', categoryId: categories.gardening.id, status: 'AVAILABLE' },
            { name: 'Edger', description: 'Gas-powered lawn edger with adjustable depth', categoryId: categories.gardening.id, status: 'AVAILABLE' },
            // Camping & Outdoor (10 items)
            { name: 'Family Tent 6-Person', description: 'Waterproof tent with rain fly and storage bag', categoryId: categories.camping.id, status: 'AVAILABLE' },
            { name: 'Sleeping Bags (4)', description: 'Set of 4 three-season sleeping bags', categoryId: categories.camping.id, status: 'AVAILABLE' },
            { name: 'Camping Stove', description: 'Two-burner propane camping stove', categoryId: categories.camping.id, status: 'AVAILABLE' },
            { name: 'Cooler 48-Quart', description: 'Insulated cooler keeps ice for 3 days', categoryId: categories.camping.id, status: 'AVAILABLE' },
            { name: 'Camping Chairs (6)', description: 'Set of 6 folding camping chairs with cup holders', categoryId: categories.camping.id, status: 'AVAILABLE' },
            { name: 'Backpacking Tent 2-Person', description: 'Lightweight tent with footprint', categoryId: categories.camping.id, status: 'AVAILABLE' },
            { name: 'Hiking Backpack 65L', description: 'Internal frame backpack with rain cover', categoryId: categories.camping.id, status: 'CHECKED_OUT' },
            { name: 'Camping Cookware Set', description: 'Pots, pans, and utensils for 4 people', categoryId: categories.camping.id, status: 'AVAILABLE' },
            { name: 'Headlamps (4)', description: 'Set of 4 LED headlamps with batteries', categoryId: categories.camping.id, status: 'AVAILABLE' },
            { name: 'Portable Fire Pit', description: 'Collapsible fire pit with carrying case', categoryId: categories.camping.id, status: 'AVAILABLE' },
            // Sports Equipment (12 items)
            { name: 'Kayak Single', description: 'Sit-on-top kayak with paddle and life vest', categoryId: categories.sports.id, status: 'AVAILABLE' },
            { name: 'Kayak Tandem', description: 'Two-person kayak with 2 paddles and vests', categoryId: categories.sports.id, status: 'AVAILABLE' },
            { name: 'Stand-Up Paddleboard', description: 'Inflatable SUP with pump and paddle', categoryId: categories.sports.id, status: 'AVAILABLE' },
            { name: 'Bike Adult (2)', description: 'Set of 2 adult mountain bikes with helmets', categoryId: categories.sports.id, status: 'AVAILABLE' },
            { name: 'Kids Bikes (4)', description: 'Set of 4 children\'s bikes (various sizes)', categoryId: categories.sports.id, status: 'AVAILABLE' },
            { name: 'Bike Rack 4-Bike', description: 'Hitch-mount bike rack for 4 bikes', categoryId: categories.sports.id, status: 'AVAILABLE' },
            { name: 'Soccer Goals (Portable)', description: 'Pop-up soccer goals with stakes', categoryId: categories.sports.id, status: 'CHECKED_OUT' },
            { name: 'Badminton Set', description: 'Net, rackets, and shuttlecocks', categoryId: categories.sports.id, status: 'AVAILABLE' },
            { name: 'Volleyball Set', description: 'Net, ball, and boundary markers', categoryId: categories.sports.id, status: 'AVAILABLE' },
            { name: 'Croquet Set', description: 'Complete croquet set for 6 players', categoryId: categories.sports.id, status: 'AVAILABLE' },
            { name: 'Bocce Ball Set', description: 'Professional bocce ball set with carrying case', categoryId: categories.sports.id, status: 'AVAILABLE' },
            { name: 'Cornhole Boards', description: 'Regulation cornhole boards with bags', categoryId: categories.sports.id, status: 'AVAILABLE' },
            // Electronics (8 items)
            { name: 'Projector & Screen', description: '1080p projector with 100" portable screen', categoryId: categories.electronics.id, status: 'AVAILABLE' },
            { name: 'PA System', description: 'Portable PA system with 2 wireless microphones', categoryId: categories.electronics.id, status: 'AVAILABLE' },
            { name: 'DSLR Camera Kit', description: 'Canon DSLR with 3 lenses and tripod', categoryId: categories.electronics.id, status: 'AVAILABLE' },
            { name: 'GoPro Action Camera', description: 'GoPro with mounts and waterproof case', categoryId: categories.electronics.id, status: 'CHECKED_OUT' },
            { name: 'Karaoke Machine', description: 'Wireless karaoke system with 2 microphones', categoryId: categories.electronics.id, status: 'AVAILABLE' },
            { name: 'Light Kit Photography', description: 'Professional lighting kit with stands', categoryId: categories.electronics.id, status: 'AVAILABLE' },
            { name: 'Metal Detector', description: 'Professional metal detector with headphones', categoryId: categories.electronics.id, status: 'AVAILABLE' },
            { name: 'Drone with Camera', description: 'Quadcopter drone with 4K camera', categoryId: categories.electronics.id, status: 'AVAILABLE' },
            // Party & Events (8 items)
            { name: 'Folding Tables (4)', description: 'Set of 4 6ft folding tables', categoryId: categories.party.id, status: 'AVAILABLE' },
            { name: 'Folding Chairs (24)', description: 'Set of 24 metal folding chairs', categoryId: categories.party.id, status: 'AVAILABLE' },
            { name: 'Canopy Tent 10x10', description: 'Pop-up canopy with sidewalls', categoryId: categories.party.id, status: 'AVAILABLE' },
            { name: 'Chocolate Fountain', description: '3-tier chocolate fountain with fondue set', categoryId: categories.party.id, status: 'AVAILABLE' },
            { name: 'Popcorn Machine', description: 'Commercial-style popcorn maker', categoryId: categories.party.id, status: 'AVAILABLE' },
            { name: 'Snow Cone Machine', description: 'Electric snow cone maker with syrups', categoryId: categories.party.id, status: 'AVAILABLE' },
            { name: 'String Lights 100ft', description: 'Outdoor string lights with bulbs', categoryId: categories.party.id, status: 'AVAILABLE' },
            { name: 'Giant Yard Games', description: 'Jenga, Connect Four, and Tic-Tac-Toe', categoryId: categories.party.id, status: 'CHECKED_OUT' },
            // Kitchen Appliances (8 items)
            { name: 'Stand Mixer', description: 'KitchenAid stand mixer with attachments', categoryId: categories.kitchen.id, status: 'AVAILABLE' },
            { name: 'Food Processor', description: '12-cup food processor with multiple blades', categoryId: categories.kitchen.id, status: 'AVAILABLE' },
            { name: 'Bread Maker', description: 'Automatic bread maker with 12 settings', categoryId: categories.kitchen.id, status: 'AVAILABLE' },
            { name: 'Ice Cream Maker', description: 'Electric ice cream maker 2-quart', categoryId: categories.kitchen.id, status: 'AVAILABLE' },
            { name: 'Pasta Maker', description: 'Manual pasta roller and cutter set', categoryId: categories.kitchen.id, status: 'AVAILABLE' },
            { name: 'Waffle Maker', description: 'Belgian waffle maker with removable plates', categoryId: categories.kitchen.id, status: 'AVAILABLE' },
            { name: 'Slow Cooker 7-Quart', description: 'Programmable slow cooker with timer', categoryId: categories.kitchen.id, status: 'AVAILABLE' },
            { name: 'Vacuum Sealer', description: 'Food vacuum sealer with bags', categoryId: categories.kitchen.id, status: 'AVAILABLE' },
        ],
    });
    console.log('✅ Created 86 items across 8 categories');
    console.log('🎉 Seeding complete!');
    console.log('\n📊 Summary:');
    console.log('- 1 Admin user');
    console.log('- 5 Member users');
    console.log('- 8 Categories');
    console.log('- 86 Items (78 available, 8 checked out)');
    console.log('\n🔑 Test accounts:');
    console.log('Admin: admin@ting.com / admin123');
    console.log('User: user@ting.com / user123');
    console.log('Other users: emma@example.com, lars@example.com, sofia@example.com, mikkel@example.com');
    console.log('All user passwords: user123');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map