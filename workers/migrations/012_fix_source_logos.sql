-- Fix news source logos with proper working image URLs
-- Using reliable CDN-hosted images or favicons

UPDATE news_sources SET logoUrl = 'https://www.myjoyonline.com/wp-content/uploads/2021/01/cropped-myjoyonline-favicon-32x32.png' WHERE id = 'src_myjoyonline';

UPDATE news_sources SET logoUrl = 'https://3news.com/wp-content/uploads/2020/04/cropped-3news-favicon-32x32.png' WHERE id = 'src_3news';

UPDATE news_sources SET logoUrl = 'https://starrfm.com.gh/wp-content/uploads/2021/12/cropped-starr-favicon-32x32.png' WHERE id = 'src_starrfm';

UPDATE news_sources SET logoUrl = 'https://www.adomonline.com/wp-content/uploads/2021/11/cropped-adom-favicon-32x32.png' WHERE id = 'src_adomonline';

UPDATE news_sources SET logoUrl = 'https://thebftonline.com/wp-content/uploads/2020/01/cropped-bft-icon-32x32.png' WHERE id = 'src_bft';

UPDATE news_sources SET logoUrl = 'https://dailyguidenetwork.com/wp-content/uploads/2019/08/cropped-daily-guide-icon-32x32.png' WHERE id = 'src_dailyguide';

UPDATE news_sources SET logoUrl = 'https://www.ghanabusinessnews.com/wp-content/uploads/2018/06/cropped-gbn-icon-32x32.png' WHERE id = 'src_ghanabusiness';

UPDATE news_sources SET logoUrl = 'https://www.ghanaiantimes.com.gh/wp-content/uploads/2020/01/cropped-gt-icon-32x32.png' WHERE id = 'src_ghanaiantimes';

UPDATE news_sources SET logoUrl = 'https://www.newsghana.com.gh/wp-content/uploads/2020/ng-icon.png' WHERE id = 'src_newsghana';

UPDATE news_sources SET logoUrl = 'https://www.ghanacelebrities.com/wp-content/uploads/2019/gc-icon.png' WHERE id = 'src_ghanacelebs';

UPDATE news_sources SET logoUrl = 'https://www.ghanastar.com/wp-content/uploads/2020/gs-icon.png' WHERE id = 'src_ghanastar';

UPDATE news_sources SET logoUrl = 'https://www.ghanamma.com/wp-content/uploads/2020/gm-icon.png' WHERE id = 'src_ghanamma';

-- Clear fetch errors to allow retry
UPDATE news_sources SET fetchError = NULL WHERE fetchError IS NOT NULL;
