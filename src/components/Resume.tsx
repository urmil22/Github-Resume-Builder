'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { LuGithub, LuSearch, LuLoaderCircle } from 'react-icons/lu';
import ResumeBox from './ResumeBox';
import { format } from 'date-fns';
import './Resume.css';

type ContributionData = {
    daily: Record<string, number>;
    types: {
        PushEvent: number;
        PullRequestEvent: number;
        IssuesEvent: number;
        CreateEvent: number;
    };
};
type GitHubEvent = {
    created_at: string;
    type: 'PushEvent' | 'PullRequestEvent' | 'IssuesEvent' | 'CreateEvent';
    [key: string]: string | number | boolean | object;  // Add any other properties from the event that may be needed
};

const Resume = () => {
    const [username, setUsername] = useState('');
    const [userData, setUserData] = useState(null);
    const [repositories, setRepositories] = useState([]);
    const [contributions, setContributions] = useState<ContributionData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const processContributions = (events: GitHubEvent[]) => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const contributionsByDay: Record<string, number> = {};
        const contributionTypes = {
            PushEvent: 0,
            PullRequestEvent: 0,
            IssuesEvent: 0,
            CreateEvent: 0,
        };

        events.forEach((event) => {
            const date = new Date(event.created_at);
            if (date > lastMonth) {
                const dateKey = format(date, 'yyyy-MM-dd');
                contributionsByDay[dateKey] = (contributionsByDay[dateKey] || 0) + 1;

                if (contributionTypes.hasOwnProperty(event.type)) {
                    contributionTypes[event.type]++;
                }
            }
        });

        return {
            daily: contributionsByDay,
            types: contributionTypes,
        };
    };

    const fetchGitHubData = async () => {
        if (!username.trim()) {
            setError('Please enter a username');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const [userResponse, repoResponse, eventsResponse] = await Promise.all([
                axios.get(`https://api.github.com/users/${username}`),
                axios.get(`https://api.github.com/users/${username}/repos?sort=stars&per_page=10`),
                axios.get(`https://api.github.com/users/${username}/events?per_page=100`)
            ]);

            // Process contribution data
            const contributionData = processContributions(eventsResponse.data);

            setUserData(userResponse.data);
            setRepositories(repoResponse.data);
            setContributions(contributionData);
        } catch {
            setError('User not found. Please check the username.');
            setUserData(null);
            setRepositories([]);
            setContributions(null);
        }
        setLoading(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            fetchGitHubData();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (error.length > 0) setError(''); // reset error message
        setUsername(e.target.value);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="resume-container"
        >
            <motion.div
                className="header"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <LuGithub size={40} className="github-icon" />
                <h1>GitHub Resume Builder</h1>
            </motion.div>

            <motion.div
                className="search-container"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <div className="input-wrapper">
                    <LuSearch className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Enter GitHub username"
                        value={username}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyPress}
                        className="search-input"
                    />
                </div>
                <motion.button
                    whileHover={{
                        translateY: -1,
                        filter: 'brightness(1.1)',
                    }}
                    onClick={fetchGitHubData}
                    disabled={loading || error.length > 0}
                    className="generate-button"
                >
                    {loading ? (
                        <LuLoaderCircle className="animate-spin" size={20} />
                    ) : (
                        'Generate Resume'
                    )}
                </motion.button>
            </motion.div>

            {error && (
                <motion.div
                    className="error-message"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {error}
                </motion.div>
            )}

            {userData && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: window.innerWidth < 768 ? 0.1 : 0.3 }}
                >
                    <ResumeBox
                        userData={userData}
                        repositories={repositories}
                        contributions={contributions}
                    />
                </motion.div>
            )}
        </motion.div>
    );
};

export default Resume;