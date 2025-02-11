// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS if available
    if (typeof AOS !== 'undefined') {
        AOS.init();
    }

    // Utility Functions
    const utils = {
        generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),

        showToast: (message, type = 'success') => {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            elements.toastContainer.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        },

        saveToLocalStorage: () => {
            localStorage.setItem('videos', JSON.stringify(state.videos));
            localStorage.setItem('categories', JSON.stringify(state.categories));
            utils.updateStats();
        },

        updateStats: () => {
            const videoCountElement = document.getElementById('videoCount');
            if (videoCountElement) {
                videoCountElement.textContent = state.videos.length;
            }
        },

        detectPlatform: (url) => {
            if (!url) return { platform: 'link' };
            const urlLower = url.toLowerCase();
            
            try {
                const urlObj = new URL(url);
                
                // YouTube detection
                if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
                    let videoId = null;
                    
                    if (urlObj.hostname.includes('youtu.be')) {
                        videoId = urlObj.pathname.slice(1);
                    } else {
                        const params = new URLSearchParams(urlObj.search);
                        videoId = params.get('v');
                    }
                    
                    return {
                        platform: 'youtube',
                        videoId: videoId
                    };
                }
                
                // Instagram detection
                if (urlObj.hostname.includes('instagram.com')) {
                    return { platform: 'instagram' };
                }
                
                // TikTok detection
                if (urlObj.hostname.includes('tiktok.com')) {
                    return { platform: 'tiktok' };
                }
                
            } catch (e) {
                console.warn('Invalid URL:', url);
            }
            
            return { platform: 'link' };
        },

        formatDate: (timestamp) => {
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(new Date(timestamp));
        },

        toggleSidebar: () => {
            state.isSidebarOpen = !state.isSidebarOpen;
            elements.sidebar.classList.toggle('active', state.isSidebarOpen);
        },

        hideContextMenu: () => {
            elements.contextMenu.style.display = 'none';
        }
    };

    // State Management
    const state = {
        videos: JSON.parse(localStorage.getItem('videos')) || [],
        categories: JSON.parse(localStorage.getItem('categories')) || [
            { id: '1', name: 'Entertainment' },
            { id: '2', name: 'Education' },
            { id: '3', name: 'Music' },
            { id: '4', name: 'Gaming' }
        ],
        isDarkMode: localStorage.getItem('darkMode') === 'true',
        isGridView: localStorage.getItem('gridView') !== 'false',
        isEditing: false,
        currentVideoId: null,
        isSidebarOpen: false
    };

    // DOM Elements
    const elements = {
        body: document.body,
        videoGrid: document.getElementById('videoGrid'),
        addVideoBtn: document.getElementById('addVideoBtn'),
        videoModal: document.getElementById('videoModal'),
        videoForm: document.getElementById('videoForm'),
        categoryModal: document.getElementById('categoryModal'),
        categoryForm: document.getElementById('categoryForm'),
        searchInput: document.getElementById('searchInput'),
        categoryFilter: document.getElementById('categoryFilter'),
        platformFilter: document.getElementById('platformFilter'),
        sortFilter: document.getElementById('sortFilter'),
        videoCount: document.getElementById('videoCount'),
        categoryCount: document.getElementById('categoryCount'),
        themeToggle: document.getElementById('themeToggle'),
        viewToggle: document.getElementById('viewToggle'),
        toastContainer: document.getElementById('toastContainer'),
        modalTitle: document.getElementById('modalTitle'),
        emptyState: document.getElementById('emptyState'),
        sidebar: document.getElementById('sidebar'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        closeSidebar: document.getElementById('closeSidebar'),
        contextMenu: document.getElementById('contextMenu'),
        addCategoryBtn: document.getElementById('addCategoryBtn'),
        closeVideoModal: document.getElementById('closeVideoModal'),
        closeCategoryModal: document.getElementById('closeCategoryModal'),
        cancelVideoBtn: document.getElementById('cancelVideoBtn'),
        cancelCategoryBtn: document.getElementById('cancelCategoryBtn'),
        dragZone: document.getElementById('dragZone')
    };

    // Video Management
    const videoManager = {
        addVideo: (videoData) => {
            const newVideo = {
                id: utils.generateId(),
                timestamp: Date.now(),
                platform: utils.detectPlatform(videoData.videoLink),
                title: videoData.videoTitle,
                link: videoData.videoLink,
                category: videoData.videoCategory
            };
            state.videos.unshift(newVideo);
            utils.saveToLocalStorage();
            videoManager.renderVideos();
            utils.showToast('Video added successfully!');
        },

        updateVideo: (videoData) => {
            const index = state.videos.findIndex(v => v.id === state.currentVideoId);
            if (index !== -1) {
                state.videos[index] = {
                    ...state.videos[index],
                    title: videoData.videoTitle,
                    link: videoData.videoLink,
                    category: videoData.videoCategory,
                    platform: utils.detectPlatform(videoData.videoLink)
                };
                utils.saveToLocalStorage();
                videoManager.renderVideos();
                utils.showToast('Video updated successfully!');
            }
        },

        deleteVideo: (id) => {
            if (confirm('Are you sure you want to delete this video?')) {
                state.videos = state.videos.filter(video => video.id !== id);
                utils.saveToLocalStorage();
                videoManager.renderVideos();
                utils.showToast('Video deleted successfully!');
            }
        },

        createVideoCard: (video) => {
            const card = document.createElement('div');
            card.className = 'video-card';
            if (typeof AOS !== 'undefined') {
                card.setAttribute('data-aos', 'fade-up');
            }
            card.setAttribute('data-id', video.id);

            // Determine platform and thumbnail
            let platformName = 'link';
            let thumbnailUrl = '';
            let thumbnailBg = '#666666';

            if (video.platform && video.platform.platform) {
                platformName = video.platform.platform;
                
                switch (platformName) {
                    case 'youtube':
                        if (video.platform.videoId) {
                            thumbnailUrl = `https://img.youtube.com/vi/${video.platform.videoId}/hqdefault.jpg`;
                            thumbnailBg = '#FF0000';
                        }
                        break;
                    case 'instagram':
                        thumbnailBg = '#E4405F';
                        break;
                    case 'tiktok':
                        thumbnailBg = '#000000';
                        break;
                }
            }

            card.innerHTML = `
                <div class="video-card-content">
                    <div class="mobile-badges">
                        <div class="mobile-badge-group">
                            <span class="category-badge">${video.category}</span>
                            <span class="platform-badge">
                                <i class="fa-brands fa-${platformName}"></i>
                            </span>
                        </div>
                    </div>
                    
                    <div class="video-thumbnail" style="background-color: ${thumbnailBg}">
                        ${thumbnailUrl ? `
                            <img src="${thumbnailUrl}" 
                                 alt="${video.title}" 
                                 loading="lazy"
                                 onerror="this.style.display='none'; this.parentElement.style.display='flex';"
                            />
                        ` : `
                            <span class="thumbnail-fallback">
                                <i class="fa-brands fa-${platformName}"></i>
                            </span>
                        `}
                    </div>

                    <div class="video-info">
                        <h3 class="video-title">${video.title}</h3>
                        <div class="video-actions">
                            <div class="action-buttons">
                                <button class="icon-btn copy-btn" title="Copy Link">
                                    <i class="fas fa-copy"></i>
                                </button>
                                <button class="icon-btn edit-btn" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="icon-btn delete-btn" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <span class="video-date">
                            <i class="far fa-clock"></i>
                            ${utils.formatDate(video.timestamp)}
                        </span>
                    </div>
                </div>
            `;

            // Add gesture support for mobile
            if (typeof Hammer !== 'undefined') {
                const hammer = new Hammer(card);
                hammer.on('press', (e) => {
                    videoManager.showContextMenu(e.center.x, e.center.y, video);
                });
            }

            // Add click handlers
            const copyBtn = card.querySelector('.copy-btn');
            const editBtn = card.querySelector('.edit-btn');
            const deleteBtn = card.querySelector('.delete-btn');

            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(video.link)
                    .then(() => utils.showToast('Link copied!'))
                    .catch(() => utils.showToast('Failed to copy link', 'error'));
            });

            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                videoManager.editVideo(video.id);
            });

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                videoManager.deleteVideo(video.id);
            });

            // Add click handler with proper event delegation
            card.addEventListener('click', (e) => {
                const actionButtons = e.target.closest('.action-buttons');
                const isButton = e.target.tagName === 'BUTTON' || 
                                e.target.closest('button') ||
                                actionButtons;
                                
                if (!isButton) {
                    window.open(video.link, '_blank', 'noopener,noreferrer');
                }
            });

            // Update thumbnail handling
            if (video.platform && video.platform.platform === 'youtube' && video.platform.videoId) {
                // Try multiple thumbnail qualities
                const thumbnailQualities = ['maxresdefault', 'hqdefault', 'mqdefault', 'default'];
                let currentQuality = 0;

                const img = new Image();
                const tryLoadThumbnail = () => {
                    if (currentQuality < thumbnailQualities.length) {
                        img.src = `https://img.youtube.com/vi/${video.platform.videoId}/${thumbnailQualities[currentQuality]}.jpg`;
                        img.onload = () => {
                            if (img.width === 120 && thumbnailQualities[currentQuality] === 'default') {
                                // YouTube's default response for invalid thumbnails
                                currentQuality++;
                                tryLoadThumbnail();
                            } else {
                                const thumbnail = card.querySelector('.video-thumbnail img');
                                if (thumbnail) {
                                    thumbnail.src = img.src;
                                }
                            }
                        };
                        img.onerror = () => {
                            currentQuality++;
                            tryLoadThumbnail();
                        };
                    }
                };
                tryLoadThumbnail();
            }

            return card;
        },

        showContextMenu: (x, y, video) => {
            const menu = elements.contextMenu;
            menu.style.display = 'block';
            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;

            // Update context menu actions
            const actions = {
                'visit': () => window.open(video.link, '_blank'),
                'copy': () => {
                    navigator.clipboard.writeText(video.link)
                        .then(() => utils.showToast('Link copied!'))
                        .catch(() => utils.showToast('Failed to copy link', 'error'));
                },
                'edit': () => videoManager.editVideo(video.id),
                'delete': () => videoManager.deleteVideo(video.id)
            };

            menu.querySelectorAll('.context-menu-item').forEach(item => {
                const action = item.dataset.action;
                item.onclick = () => {
                    actions[action]();
                    utils.hideContextMenu();
                };
            });
        },

        editVideo: (id) => {
            const video = state.videos.find(v => v.id === id);
            if (video) {
                state.isEditing = true;
                state.currentVideoId = id;
                elements.modalTitle.textContent = 'Edit Video';
                elements.videoForm.videoTitle.value = video.title;
                elements.videoForm.videoLink.value = video.link;
                elements.videoForm.videoCategory.value = video.category;
                elements.videoModal.classList.add('active');
            }
        },

        renderVideos: () => {
            let filteredVideos = [...state.videos];
            
            // Apply search filter
            const searchTerm = elements.searchInput.value.toLowerCase();
            if (searchTerm) {
                filteredVideos = filteredVideos.filter(video => 
                    video.title.toLowerCase().includes(searchTerm) || 
                    video.category.toLowerCase().includes(searchTerm)
                );
            }

            // Apply category filter
            const selectedCategory = elements.categoryFilter.querySelector('.active').dataset.category;
            if (selectedCategory !== 'all') {
                filteredVideos = filteredVideos.filter(video => 
                    video.category.toLowerCase() === selectedCategory.toLowerCase()
                );
            }

            // Apply platform filter
            const selectedPlatform = document.querySelector('.platform-stat.active').dataset.platform;
            if (selectedPlatform !== 'all') {
                filteredVideos = filteredVideos.filter(video => 
                    video.platform && video.platform.platform === selectedPlatform
                );
            }

            // Apply sort
            const sortType = elements.sortFilter.value;
            switch (sortType) {
                case 'newest':
                    filteredVideos.sort((a, b) => b.timestamp - a.timestamp);
                    break;
                case 'oldest':
                    filteredVideos.sort((a, b) => a.timestamp - b.timestamp);
                    break;
                case 'title':
                    filteredVideos.sort((a, b) => a.title.localeCompare(b.title));
                    break;
                case 'category':
                    filteredVideos.sort((a, b) => a.category.localeCompare(b.category));
                    break;
            }

            elements.videoGrid.innerHTML = '';
            elements.emptyState.style.display = filteredVideos.length === 0 ? 'block' : 'none';
            
            filteredVideos.forEach(video => {
                elements.videoGrid.appendChild(videoManager.createVideoCard(video));
            });
        }
    };

    // Event Handlers
    function setupEventListeners() {
        // Theme Toggle
        elements.themeToggle.addEventListener('click', () => {
            state.isDarkMode = !state.isDarkMode;
            elements.body.setAttribute('data-theme', state.isDarkMode ? 'dark' : 'light');
            localStorage.setItem('darkMode', state.isDarkMode);
            elements.themeToggle.innerHTML = state.isDarkMode ? 
                '<i class="fas fa-sun"></i>' : 
                '<i class="fas fa-moon"></i>';
        });

        // View Toggle
        elements.viewToggle.addEventListener('click', () => {
            state.isGridView = !state.isGridView;
            elements.videoGrid.classList.toggle('list-view', !state.isGridView);
            localStorage.setItem('gridView', state.isGridView);
            elements.viewToggle.innerHTML = state.isGridView ? 
                '<i class="fas fa-list"></i>' : 
                '<i class="fas fa-grid"></i>';
        });

        // Sidebar Toggle
        elements.sidebarToggle.addEventListener('click', utils.toggleSidebar);
        elements.closeSidebar.addEventListener('click', utils.toggleSidebar);

        // Add Video Button
        elements.addVideoBtn.addEventListener('click', () => {
            state.isEditing = false;
            state.currentVideoId = null;
            elements.modalTitle.textContent = 'Add New Video';
            elements.videoForm.reset();
            elements.videoModal.classList.add('active');
        });

        // Modal Close Buttons
        elements.closeVideoModal.addEventListener('click', () => 
            elements.videoModal.classList.remove('active'));
        elements.closeCategoryModal.addEventListener('click', () => 
            elements.categoryModal.classList.remove('active'));
        elements.cancelVideoBtn.addEventListener('click', () => 
            elements.videoModal.classList.remove('active'));
        elements.cancelCategoryBtn.addEventListener('click', () => 
            elements.categoryModal.classList.remove('active'));

        // Video Form
        elements.videoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const videoData = Object.fromEntries(formData.entries());

            if (state.isEditing) {
                videoManager.updateVideo(videoData);
            } else {
                videoManager.addVideo(videoData);
            }

            elements.videoModal.classList.remove('active');
            e.target.reset();
            state.isEditing = false;
        });

        // Search and Filters
        elements.searchInput.addEventListener('input', videoManager.renderVideos);
        elements.sortFilter.addEventListener('change', videoManager.renderVideos);

        // Filter Chips
        document.querySelectorAll('.filter-chips .chip').forEach(chip => {
            if (!chip.classList.contains('add-category')) {
                chip.addEventListener('click', () => {
                    chip.closest('.filter-chips').querySelector('.active').classList.remove('active');
                    chip.classList.add('active');
                    videoManager.renderVideos();
                });
            }
        });

        // Platform Filter Clicks
        document.querySelectorAll('.platform-stat').forEach(stat => {
            stat.addEventListener('click', () => {
                document.querySelector('.platform-stat.active').classList.remove('active');
                stat.classList.add('active');
                videoManager.renderVideos();
            });
        });

        // Hide context menu on click outside
        document.addEventListener('click', (e) => {
            if (!elements.contextMenu.contains(e.target)) {
                utils.hideContextMenu();
            }
        });

        // Add Category Button
        elements.addCategoryBtn.addEventListener('click', () => {
            elements.categoryModal.classList.add('active');
        });

        // Category Form
        elements.categoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const categoryName = e.target.categoryName.value.trim();
            
            if (!categoryName) {
                utils.showToast('Category name cannot be empty', 'error');
                return;
            }

            // Check if category exists (case-insensitive)
            const categoryExists = state.categories.some(cat => 
                cat && cat.name && cat.name.toLowerCase() === categoryName.toLowerCase()
            );

            if (categoryExists) {
                utils.showToast('Category already exists', 'error');
                return;
            }

            const newCategory = {
                id: utils.generateId(),
                name: categoryName
            };

            // Update state and UI
            state.categories.push(newCategory);
            utils.saveToLocalStorage();

            // Update category filters and form
            updateCategoryUI(newCategory);

            utils.showToast('Category added successfully!');
            elements.categoryModal.classList.remove('active');
            e.target.reset();
        });

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            const sidebar = elements.sidebar;
            const sidebarToggle = elements.sidebarToggle;
            
            if (state.isSidebarOpen && 
                !sidebar.contains(e.target) && 
                !sidebarToggle.contains(e.target)) {
                utils.toggleSidebar();
            }
        });
    }

    // Initialize App
    function initializeApp() {
        // Apply saved preferences and UI updates
        elements.body.setAttribute('data-theme', state.isDarkMode ? 'dark' : 'light');
        elements.videoGrid.classList.toggle('list-view', !state.isGridView);
        elements.themeToggle.innerHTML = state.isDarkMode ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
        elements.viewToggle.innerHTML = state.isGridView ? 
            '<i class="fas fa-list"></i>' : 
            '<i class="fas fa-grid"></i>';

        // Initialize categories
        try {
            const categoryFilter = elements.categoryFilter;
            if (categoryFilter) {
                // Create category chips HTML
                const categoryChips = [
                    '<button class="chip active" data-category="all">All</button>'
                ];

                // Add category chips from state
                state.categories.forEach(cat => {
                    if (cat && cat.name) {
                        categoryChips.push(`
                            <button class="chip" data-category="${cat.name.toLowerCase()}">
                                ${cat.name}
                            </button>
                        `);
                    }
                });

                // Add the "Add New" button
                categoryChips.push(`
                    <button class="chip add-category" id="addCategoryBtn">
                        <i class="fas fa-plus"></i> 
                    </button>
                `);

                // Set the innerHTML
                categoryFilter.innerHTML = categoryChips.join('');

                // Re-assign addCategoryBtn reference
                elements.addCategoryBtn = document.getElementById('addCategoryBtn');

                // Initialize category select in video form
                const categorySelect = elements.videoForm.querySelector('#videoCategory');
                if (categorySelect) {
                    const options = ['<option value="">Select Category</option>'];
                    state.categories.forEach(category => {
                        if (category && category.name) {
                            options.push(`
                                <option value="${category.name.toLowerCase()}">
                                    ${category.name}
                                </option>
                            `);
                        }
                    });
                    categorySelect.innerHTML = options.join('');
                }

                // Attach event listeners to chips
                categoryFilter.querySelectorAll('.chip:not(.add-category)').forEach(chip => {
                    chip.addEventListener('click', () => {
                        const activeChip = categoryFilter.querySelector('.active');
                        if (activeChip) activeChip.classList.remove('active');
                        chip.classList.add('active');
                        videoManager.renderVideos();
                    });
                });

                // Attach add category button event listener
                if (elements.addCategoryBtn) {
                    elements.addCategoryBtn.addEventListener('click', () => {
                        elements.categoryModal.classList.add('active');
                    });
                }
            }
        } catch (error) {
            console.error('Error initializing categories:', error);
        }

        setupEventListeners();
        videoManager.renderVideos();
        utils.updateStats();
    }

    // Add this helper function to update category UI
    function updateCategoryUI(category) {
        // Add new category chip
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.dataset.category = category.name.toLowerCase();
        chip.textContent = category.name;

        const addBtn = elements.categoryFilter.querySelector('.add-category');
        if (addBtn) {
            elements.categoryFilter.insertBefore(chip, addBtn);
        }

        // Add to select dropdown
        const option = document.createElement('option');
        option.value = category.name.toLowerCase();
        option.textContent = category.name;
        elements.videoForm.querySelector('#videoCategory').appendChild(option);

        // Add click handler
        chip.addEventListener('click', () => {
            const activeChip = elements.categoryFilter.querySelector('.active');
            if (activeChip) activeChip.classList.remove('active');
            chip.classList.add('active');
            videoManager.renderVideos();
        });
    }

    // Start the app
    initializeApp();
});
