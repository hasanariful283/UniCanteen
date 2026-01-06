# UniCanteen - University Food Delivery System

🎓 **UniCanteen** হলো একটি ইউনিভার্সিটি ক্যাম্পাস-বেসড ফুড ডেলিভারি প্ল্যাটফর্ম যা ক্যান্টিন, কাস্টমার এবং ডেলিভারি পার্সনদের জন্য ডিজাইন করা।

A comprehensive university campus food delivery platform built with **Next.js 16**, **React 19**, **Prisma 7**, and **PostgreSQL**.

---

## 🚀 Features

### 👨‍💼 Admin Panel
- ক্যান্টিন এবং ইউজার ম্যানেজমেন্ট
- রিয়েল-টাইম রিপোর্টস এবং অ্যানালিটিক্স
- সিস্টেম কনফিগারেশন

### 🍽️ Canteen Dashboard
- মেনু এবং ফুড আইটেম ম্যানেজমেন্ট
- অর্ডার ট্র্যাকিং এবং স্ট্যাটাস আপডেট
- ফিচার্ড আইটেম এবং ক্যাটাগরি
- ভাউচার এবং অফার ম্যানেজমেন্ট

### 👤 Customer Portal
- সার্চ এবং ফিল্টার সহ ফুড ব্রাউজিং
- রিয়েল-টাইম শপিং কার্ট
- অর্ডার হিস্টরি এবং ট্র্যাকিং
- রিভিউ এবং রেটিং সিস্টেম
- ইন-অ্যাপ মেসেজিং

### 🚴 Delivery Person Dashboard
- অর্ডার অ্যাসাইনমেন্ট এবং ম্যানেজমেন্ট
- রিয়েল-টাইম স্ট্যাটাস আপডেট
- আর্নিং ট্র্যাকার
- ডেলিভারি হিস্টরি

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16.1.1 (App Router)
- **UI Library:** React 19.2.3
- **Language:** TypeScript 5
- **Database:** PostgreSQL with Prisma 7.2.0
- **Authentication:** Clerk
- **Styling:** Tailwind CSS v4
- **UI Components:** Radix UI, Lucide React
- **Charts:** Recharts (for analytics)
- **Carousel:** Embla Carousel

---

## 📋 Prerequisites

নিশ্চিত করুন যে আপনার সিস্টেমে এগুলো ইন্সটল করা আছে:

- **Node.js:** v20.x বা তার উপরে (LTS recommended)
- **npm/yarn/pnpm:** Package manager
- **PostgreSQL:** v14+ (Local বা Cloud database)
- **Git:** Version control

---

## 🔧 Installation & Setup

### 1️⃣ Repository Clone করুন

```bash
git clone https://github.com/yourusername/unicanteen.git
cd unicanteen
```

### 2️⃣ Dependencies Install করুন

```bash
npm install
```

**অথবা yarn/pnpm ব্যবহার করতে পারেন:**
```bash
yarn install
# অথবা
pnpm install
```

### 3️⃣ Environment Variables Setup করুন

প্রজেক্ট রুটে `.env` ফাইল তৈরি করুন:

```bash
cp .env.example .env
```

**`.env` ফাইলে এই ভ্যারিয়েবলগুলো সেট করুন:**

```env
# Database (PostgreSQL connection string)
DATABASE_URL="postgresql://username:password@localhost:5432/unicanteen?schema=public"

# Clerk Authentication (https://clerk.com থেকে নিন)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# App Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4️⃣ Database Setup করুন

**Prisma Client Generate এবং Database Migrate করুন:**

```bash
# Prisma client generate
npx prisma generate

# Database migration চালান
npx prisma migrate dev

# (Optional) Prisma Studio খুলে data দেখুন
npx prisma studio
```

### 5️⃣ Development Server চালান

```bash
npm run dev
```

**Application খুলুন:** [http://localhost:3000](http://localhost:3000)

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (Turbopack সহ) |
| `npm run build` | Production build তৈরি করে |
| `npm start` | Production server চালায় |
| `npm run lint` | ESLint চালিয়ে code check করে |
| `npx prisma studio` | Prisma Studio database GUI খোলে |
| `npx prisma generate` | Prisma Client regenerate করে |
| `npx prisma migrate dev` | Database migration চালায় |

---

## 🗂️ Project Structure

```
unicanteen/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (admin)/          # Admin routes
│   │   ├── (canteen)/        # Canteen dashboard
│   │   ├── (customer)/       # Customer portal
│   │   ├── (delivery)/       # Delivery dashboard
│   │   ├── (home)/           # Public pages
│   │   └── api/              # API routes
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── forCanteen/       # Canteen-specific components
│   │   ├── forCustomer/      # Customer-specific components
│   │   └── forDelivery/      # Delivery-specific components
│   ├── actions/              # Server actions
│   │   ├── admin/
│   │   ├── canteen/
│   │   └── user/
│   ├── contexts/             # React contexts
│   ├── lib/                  # Utilities and configs
│   │   ├── prisma.ts         # Prisma client
│   │   └── utils.ts          # Helper functions
│   ├── types/                # TypeScript types
│   └── generated/            # Prisma generated types
├── public/                   # Static assets
└── package.json
```

---

## 🔐 Authentication Setup

এই প্রজেক্ট **Clerk** ব্যবহার করে authentication এর জন্য।

1. [Clerk.com](https://clerk.com) এ গিয়ে একাউন্ট তৈরি করুন
2. নতুন application তৈরি করুন
3. API keys কপি করে `.env` ফাইলে paste করুন
4. Dashboard থেকে roles configure করুন:
   - `admin`
   - `canteen`
   - `customer`
   - `delivery`

---

## 🗄️ Database Schema

প্রজেক্টে ব্যবহৃত প্রধান মডেলগুলো:

- **User** - ইউজার প্রোফাইল এবং authentication
- **Canteen** - ক্যান্টিন ইনফরমেশন
- **Food** - ফুড আইটেম এবং মেনু
- **Order** - অর্ডার ম্যানেজমেন্ট
- **OrderItem** - অর্ডার ডিটেইলস
- **DeliveryPerson** - ডেলিভারি পার্সন প্রোফাইল
- **Review** - রিভিউ এবং রেটিং
- **Message** - ইন-অ্যাপ মেসেজিং
- **Voucher** - ডিসকাউন্ট ভাউচার
- **Notification** - পুশ নোটিফিকেশন

**Full schema দেখতে:** [`prisma/schema.prisma`](prisma/schema.prisma)

---

## 🚀 Deployment

### Vercel এ Deploy করুন:

```bash
# Vercel CLI install করুন
npm i -g vercel

# Deploy করুন
vercel
```

**অথবা:**
1. [Vercel Dashboard](https://vercel.com) এ যান
2. GitHub repo connect করুন
3. Environment variables যোগ করুন
4. Deploy button ক্লিক করুন

### Database Migration (Production):

```bash
npx prisma migrate deploy
```

---

## 🤝 Contributing

Contributions welcome! এভাবে contribute করতে পারেন:

1. Fork করুন repository
2. নতুন branch তৈরি করুন (`git checkout -b feature/amazing-feature`)
3. আপনার changes commit করুন (`git commit -m 'Add amazing feature'`)
4. Branch এ push করুন (`git push origin feature/amazing-feature`)
5. Pull Request খুলুন

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Developer

**Parvez Hossain**

- GitHub: [@parvezdev](https://github.com/parvezdev)
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- Next.js Team for the amazing framework
- Prisma Team for the excellent ORM
- Clerk for authentication solution
- সকল contributors এবং users দের ধন্যবাদ!

---

**Made with ❤️ for University Students**
