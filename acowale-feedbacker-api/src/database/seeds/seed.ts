import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/acowale_feedback';

const UserSchema = new mongoose.Schema({
  _id: { type: String, default: randomUUID },
  email: String,
  passwordHash: String,
  role: String,
  refreshTokenHash: String,
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({
  _id: { type: String, default: randomUUID },
  name: String,
  slug: String,
  color: String,
  icon: String,
}, { timestamps: true });

const FeedbackSchema = new mongoose.Schema({
  _id: { type: String, default: randomUUID },
  submitterName: String,
  submitterEmail: String,
  categoryId: String,
  rating: Number,
  comment: String,
  status: String,
  ipAddress: String,
  userAgent: String,
}, { timestamps: true });

const User = mongoose.model('User', UserSchema, 'users');
const Category = mongoose.model('Category', CategorySchema, 'categories');
const Feedback = mongoose.model('Feedback', FeedbackSchema, 'feedback');

const CATEGORIES = [
  { name: 'Product Feedback', slug: 'product-feedback', color: '#6366f1', icon: '🚀' },
  { name: 'Customer Support', slug: 'customer-support', color: '#10b981', icon: '🎧' },
  { name: 'Bug Report', slug: 'bug-report', color: '#ef4444', icon: '🐛' },
  { name: 'Feature Request', slug: 'feature-request', color: '#f59e0b', icon: '💡' },
  { name: 'General Inquiry', slug: 'general-inquiry', color: '#3b82f6', icon: '📩' },
  { name: 'Billing & Payments', slug: 'billing-payments', color: '#8b5cf6', icon: '💳' },
];

const COMMENTS = [
  'The product is absolutely fantastic! I love how intuitive the interface is.',
  'I had an issue with my account but the support team resolved it quickly.',
  "Found a bug where the search bar doesn't work when filters are applied.",
  'Would love to see dark mode added to the dashboard.',
  'Just checking if there is a public API available for developers.',
  'The billing portal is confusing — please simplify the invoice section.',
  'Excellent service overall! Keep up the great work.',
  'The onboarding process could be much smoother for new users.',
  'Please add CSV export functionality for the analytics dashboard.',
  'The mobile experience needs significant improvement on smaller screens.',
  'Response times have been superb. Really impressed with the team.',
  'Feature suggestion: allow bulk status updates for feedback entries.',
  'The notification emails are arriving with a significant delay.',
  'Love the new dashboard updates! Charts are now much clearer.',
  'I was overcharged on my last invoice. Please look into this urgently.',
  'The search functionality is very powerful and saves me a lot of time.',
  'Would appreciate multi-language support in the future.',
  'The integration with third-party tools works seamlessly. Great job!',
  'Please fix the dropdown menu bug on the settings page.',
  'Overall a wonderful product. My team is very happy with it.',
];

const NAMES = [
  'Alice Johnson', 'Bob Smith', 'Carol White', 'David Brown', 'Emma Davis',
  'Frank Wilson', 'Grace Lee', 'Henry Martin', 'Isabella Garcia', 'James Taylor',
  'Kate Anderson', 'Liam Thomas', 'Mia Jackson', 'Noah Harris', 'Olivia Martinez',
  'Peter Robinson', 'Quinn Clark', 'Rachel Lewis', 'Samuel Walker', 'Tanya Hall',
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clean Database
    await User.deleteMany({});
    await Category.deleteMany({});
    await Feedback.deleteMany({});
    console.log('🧹 Cleaned existing database collections');

    // ─── Admin User ────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('Admin@123', 12);
    await User.create({
      email: 'admin@acowale.com',
      passwordHash,
      role: 'admin',
    });
    console.log('✅ Admin user created: admin@acowale.com / Admin@123');

    // ─── Categories ────────────────────────────────────────────────
    const savedCategories: any[] = [];
    for (const cat of CATEGORIES) {
      const created = await Category.create(cat);
      savedCategories.push(created);
      console.log(`✅ Category created: ${created.name}`);
    }

    // ─── Demo Feedback (20 entries) ────────────────────────────────
    const statuses = ['pending', 'reviewed', 'archived'];
    const ratings = [1, 2, 3, 4, 5];

    for (let i = 0; i < 20; i++) {
      const category = savedCategories[i % savedCategories.length];
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      await Feedback.create({
        submitterName: NAMES[i],
        submitterEmail: `${NAMES[i].split(' ')[0].toLowerCase()}@example.com`,
        categoryId: category._id,
        rating: ratings[i % ratings.length],
        comment: COMMENTS[i],
        status: statuses[i % statuses.length],
        ipAddress: `192.168.1.${i + 1}`,
        userAgent: 'Seed Script/1.0',
        createdAt,
      });
    }
    console.log('✅ 20 demo feedback entries created');

    console.log('\n🎉 Seed completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Admin Email:    admin@acowale.com');
    console.log('  Admin Password: Admin@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
