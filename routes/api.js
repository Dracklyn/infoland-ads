import express from 'express';
import { getSupabase } from '../db/database.js';

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
      throw error;
    }

    // Filter ads that are within their timeframe
    const activeAds = (allAds || []).filter(ad => {
      const createdDate = new Date(ad.created_at);
      const daysSinceCreation = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      return daysSinceCreation <= ad.timeframe_days;
    });

    // Convert image URLs to full URLs if they exist
    const baseUrl = req.protocol + '://' + req.get('host');
    const adsWithFullUrls = activeAds.map(ad => ({
      ...ad,
      image_url: ad.image_url ? `${baseUrl}${ad.image_url}` : null
    }));

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
      throw error;
    }

    // Filter ads that are within their timeframe
    const activeAds = (allAds || []).filter(ad => {
      const createdDate = new Date(ad.created_at);
      const daysSinceCreation = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      return daysSinceCreation <= ad.timeframe_days;
    });

    const baseUrl = req.protocol + '://' + req.get('host');
    const adsWithFullUrls = activeAds.map(ad => ({
      ...ad,
      image_url: ad.image_url ? `${baseUrl}${ad.image_url}` : null
    }));

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
