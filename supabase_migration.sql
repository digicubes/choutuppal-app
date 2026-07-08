-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "mandal" TEXT,
    "pincode" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "longitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Telangana',
    "brandName" TEXT NOT NULL DEFAULT 'Choutuppal App',
    "logoUrl" TEXT,
    "heroImageUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#4169E1',
    "secondaryColor" TEXT NOT NULL DEFAULT '#D4AF37',
    "latitude" DOUBLE PRECISION NOT NULL DEFAULT 17.2985,
    "longitude" DOUBLE PRECISION NOT NULL DEFAULT 78.9256,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "cityId" TEXT,
    "managedCityId" TEXT,
    "locationId" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "coinsBalance" INTEGER NOT NULL DEFAULT 0,
    "whatsappNumber" TEXT,
    "avatarUrl" TEXT,
    "agentCityId" TEXT,
    "isAgentApproved" BOOLEAN NOT NULL DEFAULT false,
    "upiId" TEXT,
    "bankDetails" TEXT,
    "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingPayout" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT,
    "cityAdminId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "agentCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cityAdminShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "superAdminShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "description" TEXT,
    "razorpayPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "upiId" TEXT,
    "bankDetails" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "services" TEXT,
    "images" TEXT,
    "whatsappNumber" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "operatingHours" TEXT,
    "qrCodeUrl" TEXT,
    "referredByAgentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealEstateListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "images" TEXT,
    "ownerPhone" TEXT NOT NULL,
    "address" TEXT,
    "bedroomCount" INTEGER,
    "area" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RealEstateListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT,
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT,
    "requirementText" TEXT,
    "source" TEXT NOT NULL DEFAULT 'form',
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoinTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL DEFAULT 'IMAGE',
    "mediaUrl" TEXT NOT NULL,
    "musicId" TEXT,
    "musicName" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicLibrary" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL DEFAULT 'Royalty Free',
    "audioUrl" TEXT NOT NULL,
    "genre" TEXT NOT NULL DEFAULT 'Telugu',
    "duration" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MusicLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "imageUrl" TEXT,
    "source" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL,
    "logoUrl" TEXT,
    "affiliateBaseUrl" TEXT,
    "heroHeadline" TEXT,
    "heroDescription" TEXT,
    "heroImageUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#D4AF37',
    "accentColor" TEXT NOT NULL DEFAULT '#4169E1',
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "ogImageUrl" TEXT,
    "whatsappSupportNumber" TEXT NOT NULL DEFAULT '918790083706',
    "whatsappCommunityLink" TEXT NOT NULL DEFAULT '',
    "whatsappChannelLink" TEXT NOT NULL DEFAULT '',
    "contactName" TEXT NOT NULL DEFAULT 'Citizen CSC',
    "contactAddress" TEXT NOT NULL DEFAULT 'Choutuppal, Yadadri, Telangana-508252',
    "contactPhone" TEXT NOT NULL DEFAULT '8790083706',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "endpoint" TEXT NOT NULL,
    "keys" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpinPrize" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "prizeType" TEXT NOT NULL,
    "prizeValue" INTEGER NOT NULL DEFAULT 0,
    "probability" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "color" TEXT NOT NULL DEFAULT '#D4AF37',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SpinPrize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BannerAd" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "shopName" TEXT NOT NULL DEFAULT '',
    "offerText" TEXT,
    "linkUrl" TEXT,
    "cityId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannerAd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "content" TEXT,
    "authorId" TEXT NOT NULL,
    "cityId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cityName" TEXT NOT NULL,
    "reason" TEXT,
    "type" TEXT NOT NULL DEFAULT 'city_admin',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "franchiseeFeePaid" BOOLEAN NOT NULL DEFAULT false,
    "razorpayPaymentId" TEXT,
    "agentCityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "avatarUrl" TEXT,
    "coverImageUrl" TEXT,
    "isPublicFigure" BOOLEAN NOT NULL DEFAULT false,
    "publicFigureCategory" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "idProofUrl" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Short" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "youtubeVideoId" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "linkedListingId" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isPromoted" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Short_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortLike" (
    "id" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortComment" (
    "id" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "iconUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoPlaylist" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "creatorId" TEXT NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoPlaylist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LongVideo" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "youtubeVideoId" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "duration" TEXT,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LongVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "timestamp" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "City_subdomain_key" ON "City"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSetting_key_key" ON "PlatformSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");

-- CreateIndex
CREATE INDEX "Story_expiresAt_idx" ON "Story"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_postId_userId_key" ON "Like"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationRequest_userId_key" ON "VerificationRequest"("userId");

-- CreateIndex
CREATE INDEX "Short_cityId_createdAt_idx" ON "Short"("cityId", "createdAt");

-- CreateIndex
CREATE INDEX "Short_isPinned_isPromoted_idx" ON "Short"("isPinned", "isPromoted");

-- CreateIndex
CREATE UNIQUE INDEX "ShortLike_shortId_userId_key" ON "ShortLike"("shortId", "userId");

-- CreateIndex
CREATE INDEX "ShortComment_shortId_createdAt_idx" ON "ShortComment"("shortId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VideoCategory_name_key" ON "VideoCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VideoCategory_slug_key" ON "VideoCategory"("slug");

-- CreateIndex
CREATE INDEX "VideoPlaylist_categoryId_sortOrder_idx" ON "VideoPlaylist"("categoryId", "sortOrder");

-- CreateIndex
CREATE INDEX "LongVideo_playlistId_sortOrder_idx" ON "LongVideo"("playlistId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "VideoProgress_userId_videoId_key" ON "VideoProgress"("userId", "videoId");

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managedCityId_fkey" FOREIGN KEY ("managedCityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_agentCityId_fkey" FOREIGN KEY ("agentCityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_cityAdminId_fkey" FOREIGN KEY ("cityAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealEstateListing" ADD CONSTRAINT "RealEstateListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealEstateListing" ADD CONSTRAINT "RealEstateListing_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinTransaction" ADD CONSTRAINT "CoinTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_musicId_fkey" FOREIGN KEY ("musicId") REFERENCES "MusicLibrary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BannerAd" ADD CONSTRAINT "BannerAd_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminRequest" ADD CONSTRAINT "AdminRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Short" ADD CONSTRAINT "Short_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Short" ADD CONSTRAINT "Short_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Short" ADD CONSTRAINT "Short_linkedListingId_fkey" FOREIGN KEY ("linkedListingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortLike" ADD CONSTRAINT "ShortLike_shortId_fkey" FOREIGN KEY ("shortId") REFERENCES "Short"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortLike" ADD CONSTRAINT "ShortLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortComment" ADD CONSTRAINT "ShortComment_shortId_fkey" FOREIGN KEY ("shortId") REFERENCES "Short"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortComment" ADD CONSTRAINT "ShortComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoPlaylist" ADD CONSTRAINT "VideoPlaylist_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VideoCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoPlaylist" ADD CONSTRAINT "VideoPlaylist_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LongVideo" ADD CONSTRAINT "LongVideo_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "VideoPlaylist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoProgress" ADD CONSTRAINT "VideoProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoProgress" ADD CONSTRAINT "VideoProgress_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "LongVideo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- â”€â”€â”€ 1. TRIGGERS & FUNCTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Auto profile creation when a user signs up through Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."User" (
    id, "fullName", phone, email, role, "coinsBalance", "subscriptionTier", "createdAt", "updatedAt"
  )
  VALUES (
    new.id::text,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User ' || substring(new.id::text from 1 for 4)),
    coalesce(new.phone, new.raw_user_meta_data->>'phone', ''),
    new.email,
    'user',
    10, -- default coin balance welcome bonus
    'free',
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public."Profile" (
    id, "userId", bio, "isPublicFigure", "isVerified", "createdAt", "updatedAt"
  )
  VALUES (
    'profile-' || new.id::text,
    new.id::text,
    '',
    false,
    false,
    now(),
    now()
  )
  ON CONFLICT ("userId") DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- â”€â”€â”€ 2. ENABLE ROW LEVEL SECURITY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Automatically enable RLS on all tables in public schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END;
$$;


-- â”€â”€â”€ 3. RLS POLICIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Drop existing policies if any to prevent conflicts
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.' || quote_ident(pol.tablename) || ';';
    END LOOP;
END;
$$;

-- 3.1. Public Read / Admin Write (Static Tables)
-- Tables: Location, City, MusicLibrary, VideoCategory, VideoPlaylist, LongVideo, SpinPrize, Announcement, SiteSetting, PlatformSetting
DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY['Location', 'City', 'MusicLibrary', 'VideoCategory', 'VideoPlaylist', 'LongVideo', 'SpinPrize', 'Announcement', 'SiteSetting', 'PlatformSetting'];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE 'CREATE POLICY select_public ON public.' || quote_ident(t) || ' FOR SELECT USING (true);';
        EXECUTE 'CREATE POLICY write_admin ON public.' || quote_ident(t) || ' FOR ALL TO authenticated USING ((SELECT role FROM public."User" WHERE id = auth.uid()::text) IN (''super_admin'', ''city_admin''));';
    END LOOP;
END;
$$;

-- 3.2. User Table Policies
CREATE POLICY select_user ON public."User" 
  FOR SELECT USING (id = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

CREATE POLICY update_user ON public."User" 
  FOR UPDATE TO authenticated USING (id = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

CREATE POLICY insert_user ON public."User" 
  FOR INSERT WITH CHECK (true);

-- 3.3. Profile Table Policies
CREATE POLICY select_profile_public ON public."Profile" 
  FOR SELECT USING (true);

CREATE POLICY write_profile_owner ON public."Profile" 
  FOR ALL TO authenticated USING ("userId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

-- 3.4. Listings Table Policies (Listing, RealEstateListing)
CREATE POLICY select_listing_public ON public."Listing" FOR SELECT USING (true);
CREATE POLICY write_listing_owner ON public."Listing" FOR ALL TO authenticated USING ("userId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin', 'agent'));

CREATE POLICY select_re_public ON public."RealEstateListing" FOR SELECT USING (true);
CREATE POLICY write_re_owner ON public."RealEstateListing" FOR ALL TO authenticated USING ("userId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

-- 3.5. Lead Table Policies
CREATE POLICY select_lead ON public."Lead" 
  FOR SELECT TO authenticated USING (
    "userId" = auth.uid()::text OR 
    (SELECT "userId" FROM public."Listing" WHERE id = "listingId") = auth.uid()::text OR
    (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin')
  );

CREATE POLICY insert_lead ON public."Lead" 
  FOR INSERT WITH CHECK (true);

CREATE POLICY write_lead ON public."Lead" 
  FOR ALL TO authenticated USING (
    (SELECT "userId" FROM public."Listing" WHERE id = "listingId") = auth.uid()::text OR 
    (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin')
  );

-- 3.6. Social Interactions / Reviews (Review, Comment, ShortComment, Post)
CREATE POLICY select_review ON public."Review" FOR SELECT USING (true);
CREATE POLICY write_review ON public."Review" FOR ALL TO authenticated USING ("userId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

CREATE POLICY select_post ON public."Post" FOR SELECT USING (true);
CREATE POLICY write_post ON public."Post" FOR ALL TO authenticated USING ("authorId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

CREATE POLICY select_comment ON public."Comment" FOR SELECT USING (true);
CREATE POLICY write_comment ON public."Comment" FOR ALL TO authenticated USING ("userId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

CREATE POLICY select_scomment ON public."ShortComment" FOR SELECT USING (true);
CREATE POLICY write_scomment ON public."ShortComment" FOR ALL TO authenticated USING ("userId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

-- 3.7. Likes & Follows (Like, ShortLike, Follow)
CREATE POLICY select_like ON public."Like" FOR SELECT USING (true);
CREATE POLICY write_like ON public."Like" FOR ALL TO authenticated USING ("userId" = auth.uid()::text);

CREATE POLICY select_slike ON public."ShortLike" FOR SELECT USING (true);
CREATE POLICY write_slike ON public."ShortLike" FOR ALL TO authenticated USING ("userId" = auth.uid()::text);

CREATE POLICY select_follow ON public."Follow" FOR SELECT USING (true);
CREATE POLICY write_follow ON public."Follow" FOR ALL TO authenticated USING ("followerId" = auth.uid()::text);

-- 3.8. Media Feeds / Ads (Story, Short, News, Blog, BannerAd)
CREATE POLICY select_story ON public."Story" FOR SELECT USING (true);
CREATE POLICY write_story ON public."Story" FOR ALL TO authenticated USING ("userId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

CREATE POLICY select_short ON public."Short" FOR SELECT USING (true);
CREATE POLICY write_short ON public."Short" FOR ALL TO authenticated USING ("userId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

CREATE POLICY select_news ON public."News" FOR SELECT USING (true);
CREATE POLICY write_news ON public."News" FOR ALL TO authenticated USING ((SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

CREATE POLICY select_blog ON public."Blog" FOR SELECT USING (true);
CREATE POLICY write_blog ON public."Blog" FOR ALL TO authenticated USING ("authorId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

CREATE POLICY select_banner ON public."BannerAd" FOR SELECT USING (true);
CREATE POLICY write_banner ON public."BannerAd" FOR ALL TO authenticated USING ((SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

-- 3.9. Transactions, Subscriptions, Progress, Admin Requests (AdminRequest, VerificationRequest, PayoutRequest, Subscription, Transaction, CoinTransaction, VideoProgress, PushSubscription)
DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY['AdminRequest', 'VerificationRequest', 'PayoutRequest', 'Subscription', 'Transaction', 'CoinTransaction', 'VideoProgress', 'PushSubscription'];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE 'CREATE POLICY manage_own ON public.' || quote_ident(t) || ' FOR ALL TO authenticated USING ("userId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN (''super_admin'', ''city_admin''));';
    END LOOP;
END;
$$;
