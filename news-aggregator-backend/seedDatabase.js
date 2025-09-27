const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Article = require('./src/models/Article');
const Source = require('./src/models/Source');
const FactCheck = require('./src/models/FactCheck');
const Notification = require('./src/models/Notification');
const Discussion = require('./src/models/Discussion');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected for seeding');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data (but keep existing users!)
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      Article.deleteMany({}),
      Source.deleteMany({}),
      FactCheck.deleteMany({}),
      Notification.deleteMany({}),
      Discussion.deleteMany({})
    ]);

    // Get existing users to reference in discussions
    console.log('👥 Getting existing users...');
    const users = await User.find({}).limit(10);
    
    if (users.length === 0) {
      console.log('⚠️ No existing users found. Please register some users first.');
      return;
    }

    console.log(`✅ Found ${users.length} existing users`);

    // Create sample sources
    console.log('📰 Creating sample sources...');
    const sources = await Source.create([
      {
        name: 'Climate Science Journal',
        domain: 'climatescience.org',
        type: 'academic-journal',
        reliabilityScore: 92,
        trustLevel: 'very-high',
        established: '2008',
        totalArticles: 1247,
        verifiedArticles: 1156,
        disputedArticles: 23,
        expertEndorsements: 45,
        peerReviewProcess: true,
        impactFactor: 8.5,
        specialties: ['Climate Science', 'Environmental Research'],
        recentAccuracy: 96,
        biasRating: 'center',
        transparencyScore: 9.2,
        correctionPolicy: 'excellent'
      },
      {
        name: 'TechNews Daily',
        domain: 'technews.com',
        type: 'news-publication',
        reliabilityScore: 67,
        trustLevel: 'medium',
        established: '2015',
        totalArticles: 3456,
        verifiedArticles: 2234,
        disputedArticles: 156,
        expertEndorsements: 12,
        peerReviewProcess: false,
        specialties: ['Technology', 'Startup News'],
        recentAccuracy: 74,
        biasRating: 'center-left',
        transparencyScore: 6.8,
        correctionPolicy: 'good'
      },
      {
        name: 'Community Herald',
        domain: 'communityherald.com',
        type: 'news-publication',
        reliabilityScore: 78,
        trustLevel: 'high',
        established: '2010',
        totalArticles: 2145,
        verifiedArticles: 1834,
        disputedArticles: 45,
        expertEndorsements: 8,
        peerReviewProcess: false,
        specialties: ['Local News', 'Community Issues'],
        recentAccuracy: 84,
        biasRating: 'center',
        transparencyScore: 7.5,
        correctionPolicy: 'good'
      }
    ]);

    console.log(`✅ Created ${sources.length} sources`);

    // Create sample articles
    console.log('📄 Creating sample articles...');
    const articles = await Article.create([
      {
        title: 'New Climate Research Shows Accelerated Ice Melting in Arctic',
        url: 'https://climatescience.org/arctic-ice-melting-2025',
        summary: 'Scientists report unprecedented rates of ice loss in the Arctic region, with implications for global sea levels.',
        fullContent: 'A comprehensive study published today reveals that Arctic ice is melting at rates 40% faster than previously recorded...',
        category: 'environment',
        tags: ['climate change', 'arctic', 'ice melting', 'sea levels'],
        submittedBy: users[1]._id,
        submittedByUsername: users[1].username,
        sourceName: sources[0].name,
        sourceDomain: sources[0].domain,
        sourceReliability: 'high',
        credibilityScore: 92,
        status: 'verified',
        verifications: 45,
        disputes: 3,
        upvotes: 67,
        downvotes: 5,
        viewCount: 1234,
        factCheckCount: 8
      },
      {
        title: 'Breaking: Major Tech Company Announces Revolutionary AI Breakthrough',
        url: 'https://technews.com/ai-breakthrough-2025',
        summary: 'Tech giant claims to have developed AI system with human-level reasoning capabilities.',
        fullContent: 'In a surprise announcement today, a leading technology company unveiled what they claim to be a breakthrough in artificial intelligence...',
        category: 'tech',
        tags: ['artificial intelligence', 'technology', 'breakthrough', 'AI'],
        submittedBy: users[2]._id,
        submittedByUsername: users[2].username,
        sourceName: sources[1].name,
        sourceDomain: sources[1].domain,
        sourceReliability: 'medium',
        credibilityScore: 67,
        status: 'under-review',
        verifications: 12,
        disputes: 18,
        upvotes: 34,
        downvotes: 12,
        viewCount: 892,
        factCheckCount: 5
      },
      {
        title: 'Local Community Initiative Reduces Food Waste by 70%',
        url: 'https://communityherald.com/food-waste-reduction-2025',
        summary: 'Innovative program in metropolitan area shows promising results in waste reduction.',
        fullContent: 'A grassroots initiative launched six months ago has achieved remarkable success in reducing food waste across the metropolitan area...',
        category: 'social',
        tags: ['food waste', 'community', 'sustainability', 'local news'],
        submittedBy: users[3]._id,
        submittedByUsername: users[3].username,
        sourceName: sources[2].name,
        sourceDomain: sources[2].domain,
        sourceReliability: 'medium',
        credibilityScore: 84,
        status: 'verified',
        verifications: 28,
        disputes: 2,
        upvotes: 41,
        downvotes: 3,
        viewCount: 567,
        factCheckCount: 6
      }
    ]);

    console.log(`✅ Created ${articles.length} articles`);

    // Create sample discussions
    console.log('💬 Creating sample discussions...');
    const discussions = await Discussion.create([
      {
        title: 'How do we combat misinformation on social media?',
        content: 'With the rise of social media platforms, misinformation spreads faster than ever. What are the most effective strategies fact-checkers should use to counter false narratives?',
        author: users[1]._id,
        category: 'general',
        tags: ['misinformation', 'social-media', 'strategy'],
        upvotes: 12,
        downvotes: 2,
        totalVotes: 10,
        viewCount: 156,
        replies: [
          {
            userId: users[2]._id,
            content: 'I think the key is speed. We need to fact-check claims within hours, not days. By the time we respond, the false information has already spread.',
            upvotes: 8,
            downvotes: 1,
            totalVotes: 7
          },
          {
            userId: users[3]._id,
            content: 'Education is more important than speed. We should focus on teaching people how to identify unreliable sources.',
            upvotes: 6,
            downvotes: 0,
            totalVotes: 6
          }
        ]
      },
      {
        title: 'Best tools for fact-checking in 2024',
        content: 'What are your go-to tools and resources for fact-checking? I\'m looking to expand my toolkit and would love recommendations from experienced fact-checkers.',
        author: users[3]._id,
        category: 'general',
        tags: ['tools', 'resources', 'fact-checking'],
        upvotes: 18,
        downvotes: 0,
        totalVotes: 18,
        viewCount: 243,
        replies: [
          {
            userId: users[0]._id,
            content: 'I highly recommend using reverse image search tools like TinEye and Google Images for visual verification.',
            upvotes: 15,
            downvotes: 0,
            totalVotes: 15
          }
        ]
      },
      {
        title: 'Climate change fact-checking: Common misconceptions',
        content: 'As someone who frequently fact-checks climate-related claims, I\'ve noticed certain misconceptions keep appearing. Let\'s discuss the most persistent myths and how to address them effectively.',
        author: users[1]._id,
        category: 'science',
        tags: ['climate-change', 'science', 'misconceptions'],
        upvotes: 25,
        downvotes: 3,
        totalVotes: 22,
        viewCount: 312
      },
      {
        title: 'Verifying political statements during election season',
        content: 'Election season brings a flood of political claims that need verification. What\'s the best approach for maintaining objectivity while fact-checking political statements?',
        author: users[2]._id,
        category: 'politics',
        tags: ['politics', 'elections', 'objectivity'],
        upvotes: 14,
        downvotes: 5,
        totalVotes: 9,
        viewCount: 198,
        replies: [
          {
            userId: users[1]._id,
            content: 'Always cite primary sources and avoid opinion-based language. Stick to verifiable facts only.',
            upvotes: 10,
            downvotes: 1,
            totalVotes: 9
          }
        ]
      }
    ]);

    console.log(`✅ Created ${discussions.length} discussions`);

    // Create sample fact-checks
    console.log('🔍 Creating sample fact-checks...');
    const factChecks = await FactCheck.create([
      {
        articleId: articles[0]._id,
        reviewer: users[0]._id,
        reviewerUsername: users[0].username,
        verdict: 'true',
        confidence: 9,
        evidence: 'The research methodology is sound and the data sources are credible. Multiple independent studies confirm similar findings.',
        sources: [
          'https://nature.com/climate-studies-2025',
          'https://noaa.gov/arctic-monitoring-data'
        ],
        expertise: ['Science', 'Climate Research'],
        upvotes: 23,
        downvotes: 2,
        reviewerReputationAtTime: 85
      },
      {
        articleId: articles[1]._id,
        reviewer: users[1]._id,
        reviewerUsername: users[1].username,
        verdict: 'mixed',
        confidence: 6,
        evidence: 'While the technical claims appear sound, the article uses sensationalized language that may mislead readers. The breakthrough is significant but not as revolutionary as claimed.',
        sources: [
          'https://arxiv.org/ai-research-papers',
          'https://ieee.org/ai-standards'
        ],
        expertise: ['Technology', 'AI Research'],
        upvotes: 15,
        downvotes: 3,
        reviewerReputationAtTime: 2847
      }
    ]);

    console.log(`✅ Created ${factChecks.length} fact-checks`);

    // Create sample notifications
    console.log('🔔 Creating sample notifications...');
    const notifications = await Notification.create([
      {
        userId: users[0]._id,
        type: 'article_verified',
        title: 'Article Verified',
        message: 'Your submitted article "Climate Research Breakthrough" has been verified by the community.',
        relatedArticle: articles[0]._id,
        actionable: true,
        actionUrl: `/dashboard/article/${articles[0]._id}`,
        actionText: 'View Article',
        icon: 'CheckCircle',
        color: 'green',
        category: 'verification',
        isRead: false
      },
      {
        userId: users[1]._id,
        type: 'reputation_milestone',
        title: 'Reputation Milestone!',
        message: 'Congratulations! You\'ve reached 2000 reputation points.',
        actionable: false,
        icon: 'Award',
        color: 'purple',
        category: 'achievement',
        isRead: true
      }
    ]);

    console.log(`✅ Created ${notifications.length} notifications`);

    console.log('🎉 Database seeded successfully!');
    console.log(`
    Demo credentials:
    Username: 123
    Password: 123
    
    Other users:
    - DrClimateExpert / password123
    - NewsValidator / password123  
    - TruthSeeker99 / password123
    `);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

const runSeeder = async () => {
  await connectDB();
  await seedData();
  process.exit(0);
};

runSeeder();