document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const welcomeModal = document.getElementById('welcomeModal');
    const usernameForm = document.getElementById('usernameForm');
    const usernameInput = document.getElementById('usernameInput');
    const chatContainer = document.getElementById('chatContainer');
    const conversationContainer = document.getElementById('conversationContainer');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const mobileUsernameDisplay = document.getElementById('mobileUsernameDisplay');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const mobileThemeToggleBtn = document.getElementById('mobilethemeToggleBtn');
    
    // State variables
    let username = localStorage.getItem('username');
    let conversation = JSON.parse(localStorage.getItem('conversation') || '[]');
    let isWaitingForResponse = false;
    
    // Theme preference
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    let currentTheme = localStorage.getItem('theme') || (prefersDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', currentTheme === 'dark');
    updateThemeIcon();
    
    // Initialize UI based on user state
    initializeUI();
    
    // Get the clear chat buttons
    const clearChatBtn = document.getElementById('clearChatBtn');
    const mobileClearChatBtn = document.getElementById('mobileClearChatBtn');
    
    // Event listeners
    usernameForm.addEventListener('submit', handleUsernameSubmit);
    messageForm.addEventListener('submit', handleMessageSubmit);
    themeToggleBtn.addEventListener('click', toggleTheme);
    mobileThemeToggleBtn.addEventListener('click', toggleTheme);
    clearChatBtn.addEventListener('click', clearChat);
    mobileClearChatBtn.addEventListener('click', clearChat);
    
    /**
     * Initialize the UI based on whether the user has a username
     */
    function initializeUI() {
        const userId = localStorage.getItem('user_id');
        
        if (username && userId) {
            // User has a username and ID, show chat interface
            chatContainer.classList.remove('hidden');
            usernameDisplay.textContent = username;
            mobileUsernameDisplay.textContent = username;
            
            // Hide welcome modal
            welcomeModal.classList.add('hidden');
            
            // Load messages from database
            loadMessagesFromDatabase();
        } else {
            // New user, make sure welcome modal is shown
            welcomeModal.classList.remove('hidden');
        }
    }
    
    /**
     * Handle username form submission
     */
    function handleUsernameSubmit(event) {
        event.preventDefault();
        username = usernameInput.value.trim();
        
        if (username) {
            // Register/login user with the backend
            fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Save user data
                    localStorage.setItem('username', username);
                    localStorage.setItem('user_id', data.user_id);
                    usernameDisplay.textContent = username;
                    mobileUsernameDisplay.textContent = username;
                    
                    // Hide modal and show chat
                    welcomeModal.classList.add('hidden');
                    chatContainer.classList.remove('hidden');
                    
                    // Load message history from the database
                    loadMessagesFromDatabase();
                } else {
                    // Show error
                    alert('Error: ' + (data.message || 'Failed to register user'));
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Network error: Could not connect to the server.');
            });
        }
    }
    
    /**
     * Handle message form submission
     */
    function handleMessageSubmit(event) {
        event.preventDefault();
        
        if (isWaitingForResponse) {
            return; // Prevent sending multiple messages while waiting
        }
        
        const message = messageInput.value.trim();
        
        if (message) {
            // Add user message to UI
            addMessageToUI('user', message);
            
            // Clear input
            messageInput.value = '';
            
            // Add to conversation history
            addToConversation('user', message);
            
            // Show typing indicator
            showTypingIndicator();
            
            // Get AI response
            getAIResponse(message);
        }
    }
    
    /**
     * Add a message to the UI
     */
    function addMessageToUI(role, content) {
        const messageDiv = document.createElement('div');
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.className = 'flex flex-col mb-4 ' + (role === 'user' ? 'items-end' : 'items-start');
        
        messageDiv.innerHTML = `
            <div class="message message-${role === 'user' ? 'user' : 'ai'} px-4 py-3 max-w-[80%]">
                <div class="message-content">${formatMessageContent(content)}</div>
            </div>
            <div class="text-xs text-gray-500 mt-1">${timestamp}</div>
        `;
        
        conversationContainer.appendChild(messageDiv);
        scrollToBottom();
    }
    
    /**
     * Format message content (handle URLs, line breaks, etc.)
     */
    function formatMessageContent(content) {
        // Convert URLs to links
        content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        
        // Convert line breaks to <br>
        return content.replace(/\n/g, '<br>');
    }
    
    /**
     * Show typing indicator while waiting for AI response
     */
    function showTypingIndicator() {
        isWaitingForResponse = true;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'flex items-start';
        typingDiv.id = 'typingIndicator';
        
        typingDiv.innerHTML = `
            <div class="message message-ai px-4 py-3">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        conversationContainer.appendChild(typingDiv);
        scrollToBottom();
    }
    
    /**
     * Hide the typing indicator
     */
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        isWaitingForResponse = false;
    }
    
    /**
     * Add a message to the conversation history
     */
    function addToConversation(role, content) {
        conversation.push({ role, content, timestamp: new Date().toISOString() });
        saveConversation();
    }
    
    /**
     * Save conversation to localStorage
     */
    function saveConversation() {
        localStorage.setItem('conversation', JSON.stringify(conversation));
    }
    
    /**
     * Load messages from the database for the current user
     */
    function loadMessagesFromDatabase() {
        const userId = localStorage.getItem('user_id');
        
        if (!userId) {
            return; // No user ID, can't load messages
        }
        
        fetch(`/api/messages?user_id=${userId}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Clear container
                    conversationContainer.innerHTML = ''; 
                    
                    // Process messages
                    if (data.messages && data.messages.length > 0) {
                        // Hide welcome message
                        const welcomeMessage = document.querySelector('.welcome-message');
                        if (welcomeMessage) {
                            welcomeMessage.style.display = 'none';
                        }
                        
                        // Clear local conversation and rebuild from database
                        conversation = [];
                        
                        // Add messages to UI and update local conversation
                        data.messages.forEach(msg => {
                            addMessageToUI(msg.role, msg.content);
                            conversation.push({
                                role: msg.role,
                                content: msg.content,
                                timestamp: msg.timestamp
                            });
                        });
                        
                        // Save to localStorage as backup
                        saveConversation();
                    }
                } else {
                    console.error('Error loading messages:', data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching messages:', error);
                
                // Fallback to local storage if database fetch fails
                loadConversationFromLocalStorage();
            });
    }
    
    /**
     * Load conversation history from localStorage (fallback)
     */
    function loadConversationFromLocalStorage() {
        conversationContainer.innerHTML = ''; // Clear container
        
        if (conversation.length === 0) {
            // Show welcome message if no conversation history
            return;
        }
        
        // Hide welcome message
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
        
        // Add messages to UI
        conversation.forEach(msg => {
            addMessageToUI(msg.role, msg.content);
        });
    }
    
    /**
     * Get AI response from the backend
     */
    function getAIResponse(message) {
        const userId = localStorage.getItem('user_id');
        
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                username: username,
                user_id: userId,
                conversation_history: conversation
            }),
        })
        .then(response => response.json())
        .then(data => {
            // Hide typing indicator
            hideTypingIndicator();
            
            // Hide welcome message if visible
            const welcomeMessage = document.querySelector('.welcome-message');
            if (welcomeMessage) {
                welcomeMessage.style.display = 'none';
            }
            
            if (data.status === 'success') {
                // Add AI response to UI
                addMessageToUI('assistant', data.response);
                
                // Add to conversation history (local backup)
                addToConversation('assistant', data.response);
            } else {
                // Show error
                showError(data.message || 'An error occurred while getting a response.');
            }
        })
        .catch(error => {
            hideTypingIndicator();
            showError('Network error: Could not connect to the server.');
            console.error('Error:', error);
        });
    }
    
    /**
     * Show an error message in the conversation
     */
    function showError(errorMessage) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-900/50 text-red-100 border border-red-700 rounded-md p-3 my-2 w-full text-center';
        errorDiv.textContent = errorMessage;
        
        conversationContainer.appendChild(errorDiv);
        scrollToBottom();
    }
    
    /**
     * Scroll conversation to the bottom
     */
    function scrollToBottom() {
        conversationContainer.scrollTop = conversationContainer.scrollHeight;
    }
    
    /**
     * Toggle between light and dark theme
     */
    function toggleTheme() {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark', currentTheme === 'dark');
        localStorage.setItem('theme', currentTheme);
        updateThemeIcon();
    }
    
    /**
     * Update theme toggle icon based on current theme
     */
    function updateThemeIcon() {
        const icons = document.querySelectorAll('.theme-toggle i');
        icons.forEach(icon => {
            if (currentTheme === 'dark') {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        });
    }
    
    /**
     * Clear the chat history
     */
    function clearChat() {
        const userId = localStorage.getItem('user_id');
        
        if (!userId) {
            alert('User not found. Please reload the page and try again.');
            return;
        }
        
        // Ask for confirmation
        if (!confirm('Are you sure you want to clear your chat history? This cannot be undone.')) {
            return;
        }
        
        // Show loading
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'text-center my-6';
        loadingMessage.innerHTML = '<div class="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" role="status"></div><p class="mt-2 text-gray-400">Clearing chat history...</p>';
        conversationContainer.innerHTML = '';
        conversationContainer.appendChild(loadingMessage);
        
        // Make API request to clear messages
        fetch('/api/messages/clear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Clear local conversation
                conversation = [];
                localStorage.removeItem('conversation');
                
                // Clear UI
                conversationContainer.innerHTML = '';
                
                // Show welcome message
                const welcomeMessage = document.createElement('div');
                welcomeMessage.className = 'welcome-message text-center py-10';
                welcomeMessage.innerHTML = `
                    <img src="https://pixabay.com/get/gbd3612108892163eb985b96454d9e7dd4e0a476496213b135a79d43542de268fbea92a84dae5a33f957315fe1ab99f93c82f8c0475183d19c22707264bb16354_1280.jpg" 
                         alt="Welcome to chat" class="mx-auto rounded-lg mb-6 max-w-[200px]">
                    <h5 class="text-xl font-semibold mb-2">Welcome to AI Chat!</h5>
                    <p class="text-gray-400">Chat history has been cleared. Ask me anything to get started.</p>
                `;
                conversationContainer.appendChild(welcomeMessage);
            } else {
                // Show error
                conversationContainer.innerHTML = '';
                showError(data.message || 'An error occurred while clearing the chat history.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            conversationContainer.innerHTML = '';
            showError('Network error: Could not connect to the server.');
        });
    }
});
