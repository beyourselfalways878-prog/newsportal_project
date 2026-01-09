import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, MapPin } from 'lucide-react';
import { mockNewsData } from '@/lib/data';
import { Button } from '@/components/ui/button';

const RegionalNewsWidget = ({ title, currentContent, onArticleClick }) => {
	const [regionalNews, setRegionalNews] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchRegionalNews = useCallback(async () => {
		setIsLoading(true);
		setTimeout(() => {
			setRegionalNews(mockNewsData.regional.slice(0, 3).map((n) => ({ ...n, is_mock: true })));
			setIsLoading(false);
		}, 300);
	}, []);

	useEffect(() => {
		fetchRegionalNews();
	}, [fetchRegionalNews]);

	const getDisplayContent = (item, fieldPrefix) => {
		const hindiField = `${fieldPrefix}_hi`;
		return item[hindiField] || item[fieldPrefix] || currentContent?.notAvailable || 'उपलब्ध नहीं';
	};

	if (isLoading) {
		return (
			<div className="bg-card news-card p-6 mb-8">
				<h3 className="text-xl font-bold mb-5 flex items-center text-foreground">
					<MapPin className="h-6 w-6 mr-2 text-primary" />
					{title}
				</h3>
				{[...Array(3)].map((_, i) => (
					<div key={i} className="mb-3 h-12 bg-muted/50 rounded loading-pulse"></div>
				))}
			</div>
		);
	}

	if (!regionalNews || regionalNews.length === 0) {
		return null;
	}

	return (
		<div className="bg-card news-card p-6 mb-8">
			<h3 className="text-xl font-bold mb-5 flex items-center text-foreground">
				<MapPin className="h-6 w-6 mr-2 text-primary" />
				{title}
			</h3>
			<div className="space-y-4">
				{regionalNews.map((item, index) => (
					<motion.div
						key={item.id || index}
						initial={{ opacity: 0, y: 15 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.15, type: 'spring', stiffness: 100 }}
						className="group p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 border-l-4 border-primary/50 hover:border-primary"
						onClick={() => {
							const articleToOpen = {
								id: item.id,
								title: getDisplayContent(item, 'news'),
								content: getDisplayContent(item, 'news_details') || getDisplayContent(item, 'news'),
								category: 'regional',
								state: getDisplayContent(item, 'state'),
								image_url: item.image_url || 'default_regional_image_description',
								published_at: item.created_at,
								is_regional_news: true,
							};

							onArticleClick(articleToOpen);
						}}
						role="button"
						tabIndex={0}
						onKeyDown={(e) => e.key === 'Enter' && onArticleClick(item)}
					>
						<h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
							{getDisplayContent(item, 'state')}
						</h4>
						<p className="text-xs text-muted-foreground line-clamp-2">{getDisplayContent(item, 'news')}</p>
					</motion.div>
				))}

				{regionalNews.length > 3 && (
					<Button variant="link" size="sm" className="text-primary hover:text-accent mt-2">
						{currentContent?.viewMore || 'और देखें'}
						<ExternalLink className="h-3.5 w-3.5 ml-1.5" />
					</Button>
				)}
			</div>
		</div>
	);
};

export default RegionalNewsWidget;

