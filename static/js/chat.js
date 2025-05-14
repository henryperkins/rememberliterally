document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const welcomeModal = new bootstrap.Modal(document.getElementById('welcomeModal'));
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
    document.documentElement.setAttribute('data-bs-theme', currentTheme);
    updateThemeIcon();
    
    // Initialize UI based on user state
    initializeUI();
    
    // Event listeners
    usernameForm.addEventListener('submit', handleUsernameSubmit);
    messageForm.addEventListener('submit', handleMessageSubmit);
    themeToggleBtn.addEventListener('click', toggleTheme);
    mobileThemeToggleBtn.addEventListener('click', toggleTheme);
    
    /**
     * Initialize the UI based on whether the user has a username
     */
    function initializeUI() {
        if (username) {
            // User has a username, show chat interface
            chatContainer.classList.remove('d-none');
            usernameDisplay.textContent = username;
            mobileUsernameDisplay.textContent = username;
            
            // Load conversation history
            loadConversationHistory();
        } else {
            // New user, show welcome modal
            welcomeModal.show();
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
                    welcomeModal.hide();
                    chatContainer.classList.remove('d-none');
                    
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
        
        messageDiv.className = 'd-flex flex-column ' + (role === 'user' ? 'align-items-end' : 'align-items-start');
        
        messageDiv.innerHTML = `
            <div class="message message-${role === 'user' ? 'user' : 'ai'}">
                <div class="message-content">${formatMessageContent(content)}</div>
            </div>
            <div class="message-timestamp">${timestamp}</div>
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
        typingDiv.className = 'd-flex align-items-start';
        typingDiv.id = 'typingIndicator';
        
        typingDiv.innerHTML = `
            <div class="message message-ai">
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
     * Load conversation history from localStorage
     */
    function loadConversationHistory() {
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
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                username: username,
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
                
                // Add to conversation history
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
        errorDiv.className = 'error-message';
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
        document.documentElement.setAttribute('data-bs-theme', currentTheme);
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
});
