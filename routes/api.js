import express from 'express';
import { getSupabase } from '../db/database.js';
import { isCloudinaryUrl } from '../utils/cloudinary.js';

const router = express.Router();

// Public API endpoint for external platforms to fetch active ads
router.get('/ads', async (req, res) => {
  try {
    const supabase = getSupabase();
    const now = new Date();
    
    // Calculate the date threshold (now - timeframe_days)
    // Get all active ads first, then filter by timeframe
    const { data: allAds, error } = await supabase
      .from('ads')
      .select('id, title, description, image_url, cta_url, category, timeframe_days, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching active ads:', error);
      throw error;
    }

    console.log(`📊 Found ${allAds?.length || 0} active ads in database`);

    // Filter ads that are within their timeframe
    const activeAds = (allAds || []).filter(ad => {
      const createdDate = new Date(ad.created_at);
      const daysSinceCreation = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      const isWithinTimeframe = daysSinceCreation <= ad.timeframe_days;
      if (!isWithinTimeframe) {
        console.log(`⏰ Ad "${ad.title}" (ID: ${ad.id}) expired: ${daysSinceCreation} days > ${ad.timeframe_days} days`);
      }
      return isWithinTimeframe;
    });
    
    console.log(`✅ Returning ${activeAds.length} active ads within timeframe`);

    // Convert image URLs to full URLs if they exist and are relative paths
    const baseUrl = req.protocol + '://' + req.get('host');
    const adsWithFullUrls = activeAds.map(ad => {
      let imageUrl = ad.image_url;
      // Only prepend baseUrl if it's a relative path (not already a full URL)
      if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        imageUrl = `${baseUrl}${imageUrl}`;
      }
      return {
      ...ad,
        image_url: imageUrl || null
      };
    });

    res.json({
      success: true,
      count: adsWithFullUrls.length,
      ads: adsWithFullUrls
    });
  } catch (error) {
    console.error('Error fetching ads for integration:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get ads by category
router.get('/ads/category/:category', async (req, res) => {
  try {
    const supabase = getSupabase();
    const now = new Date();

    const { data: allAds, error } = await supabase
      .from('ads')
      .select('id, title, description, image_url, cta_url, category, timeframe_days, created_at')
      .eq('is_active', true)
      .eq('category', req.params.category)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching ads by category:', error);
      throw error;
    }

    console.log(`📊 Found ${allAds?.length || 0} active ads in category "${req.params.category}"`);

    // Filter ads that are within their timeframe
    const activeAds = (allAds || []).filter(ad => {
      const createdDate = new Date(ad.created_at);
      const daysSinceCreation = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      const isWithinTimeframe = daysSinceCreation <= ad.timeframe_days;
      if (!isWithinTimeframe) {
        console.log(`⏰ Ad "${ad.title}" (ID: ${ad.id}) expired: ${daysSinceCreation} days > ${ad.timeframe_days} days`);
      }
      return isWithinTimeframe;
    });
    
    console.log(`✅ Returning ${activeAds.length} active ads within timeframe for category "${req.params.category}"`);

    // Convert image URLs to full URLs if they exist and are relative paths
    const baseUrl = req.protocol + '://' + req.get('host');
    const adsWithFullUrls = activeAds.map(ad => {
      let imageUrl = ad.image_url;
      // Only prepend baseUrl if it's a relative path (not already a full URL)
      if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        imageUrl = `${baseUrl}${imageUrl}`;
      }
      return {
      ...ad,
        image_url: imageUrl || null
      };
    });

    res.json({
      success: true,
      count: adsWithFullUrls.length,
      ads: adsWithFullUrls
    });
  } catch (error) {
    console.error('Error fetching ads by category:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

export { router as apiRoutes };
