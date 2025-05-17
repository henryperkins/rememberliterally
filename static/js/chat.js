// Add CSS for code blocks
const codeBlockStyles = document.createElement('style');
codeBlockStyles.textContent = `
    .code-block {
        margin: 1rem 0;
        border-radius: 0.375rem;
        overflow: hidden;
        border: 1px solid rgba(75, 85, 99, 0.4);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    .code-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 1rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        border-bottom: 1px solid rgba(75, 85, 99, 0.4);
    }
    .code-block pre {
        margin: 0;
        padding: 1rem;
        overflow-x: auto;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.875rem;
        line-height: 1.5;
    }
    .code-block code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        white-space: pre;
        word-break: normal;
        word-wrap: normal;
    }
    .copy-code-btn {
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
    }
    .copy-code-btn:hover {
        opacity: 0.9;
    }
    .copy-code-btn:disabled {
        opacity: 0.7;
        cursor: default;
    }
    .message-content code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        background-color: rgba(0, 0, 0, 0.1);
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
    }
    
    /* Light mode adjustments */
    html:not(.dark) .code-block {
        background-color: #f3f4f6;
        border-color: #d1d5db;
    }
    html:not(.dark) .code-header {
        background-color: #e5e7eb;
        border-color: #d1d5db;
    }
    html:not(.dark) .code-block pre {
        color: #1f2937;
    }
    
    /* Syntax highlighting classes */
    .language-javascript .keyword { color: #8b5cf6; }
    .language-javascript .string { color: #10b981; }
    .language-javascript .number { color: #f59e0b; }
    .language-javascript .comment { color: #6b7280; font-style: italic; }
    
    .language-python .keyword { color: #8b5cf6; }
    .language-python .string { color: #10b981; }
    .language-python .number { color: #f59e0b; }
    .language-python .comment { color: #6b7280; font-style: italic; }
    
    .language-html .tag { color: #ef4444; }
    .language-html .attr { color: #8b5cf6; }
    .language-html .string { color: #10b981; }
`;
document.head.appendChild(codeBlockStyles);

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
    const mobileThemeToggleBtn = document.getElementById('mobileThemeToggleBtn');
    const imageUploadInput = document.getElementById('imageUpload');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');
    
    // Advanced options elements
    const toggleAdvancedOptionsBtn = document.getElementById('toggleAdvancedOptions');
    const advancedOptionsPanel = document.getElementById('advancedOptionsPanel');
    const advancedOptionsIcon = document.getElementById('advancedOptionsIcon');
    const modelSelect = document.getElementById('modelSelect');
    const reasoningEffortRadios = document.getElementsByName('reasoningEffort');
    const developerMessageInput = document.getElementById('developerMessageInput');
    
    // State variables
    let username = localStorage.getItem('username');
    let conversation = JSON.parse(localStorage.getItem('conversation') || '[]');
    let isWaitingForResponse = false;
    let imageData = null; // For storing base64 encoded image data
    let showAdvancedOptions = false; // Track if advanced options panel is visible
    let availableModels = []; // Store available model deployments
    
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
    imageUploadInput.addEventListener('change', handleImageUpload);
    removeImageBtn.addEventListener('click', clearImageUpload);
    
    // Note: model selection event listener is set in initializeUI
    // Advanced options toggle
    toggleAdvancedOptionsBtn.addEventListener('click', toggleAdvancedOptions);
    
    /**
     * Fetch available models from the API
     */
    function fetchAvailableModels() {
        fetch('/api/models')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    availableModels = data.models;
                    
                    // Clear existing options
                    modelSelect.innerHTML = '';
                    
                    // Add options to the select element
                    availableModels.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model.id;
                        option.textContent = model.name;
                        option.title = model.description; // Add description as a tooltip
                        modelSelect.appendChild(option);
                    });
                    
                    // Set default selected model from localStorage or first available
                    const savedModel = localStorage.getItem('selectedModel');
                    if (savedModel && availableModels.some(m => m.id === savedModel)) {
                        modelSelect.value = savedModel;
                    } else if (availableModels.length > 0) {
                        modelSelect.value = availableModels[0].id;
                        localStorage.setItem('selectedModel', availableModels[0].id);
                    }
                } else {
                    console.error('Error fetching models:', data.message);
                }
            })
            .catch(error => {
                console.error('Network error when fetching models:', error);
            });
    }
    
    /**
     * Get the selected model ID
     */
    function getSelectedModel() {
        return modelSelect.value;
    }
    
    /**
     * Initialize the UI based on whether the user has a username
     */
    function initializeUI() {
        const userId = localStorage.getItem('user_id');
        
        // Fetch available models regardless of login status
        fetchAvailableModels();
        
        // Set up model selection change handler
        modelSelect.addEventListener('change', function() {
            localStorage.setItem('selectedModel', this.value);
        });
        
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
        const hasImage = imageData ? true : false;
        
        // Get advanced options values
        const reasoningEffort = getSelectedReasoningEffort();
        const developerMessage = developerMessageInput.value.trim();
        const selectedModel = getSelectedModel();
        
        if (message || hasImage) {
            // Add user message to UI (with image if present)
            addMessageToUI('user', message, hasImage ? imageData : null);
            
            // Clear input and image preview
            messageInput.value = '';
            if (hasImage) {
                clearImageUpload();
            }
            
            // Add to conversation history
            addToConversation('user', message, hasImage ? imageData : null);
            
            // Show typing indicator
            showTypingIndicator();
            
            // Get AI response with streaming option
            const useStreaming = true; // Enable streaming for better UX
            getAIResponse(message, imageData, useStreaming, reasoningEffort, developerMessage, selectedModel);
        }
    }
    
    /**
     * Add a message to the UI
     * @param {string} role - 'user' or 'assistant'
     * @param {string} content - Message text content
     * @param {string|null} imageData - Base64 encoded image data (optional)
     * @param {boolean} isStreaming - Whether this message is streaming (optional)
     */
    function addMessageToUI(role, content, imageData = null, isStreaming = false) {
        const messageDiv = document.createElement('div');
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Set an ID for streaming messages so we can update them later
        if (isStreaming) {
            messageDiv.id = 'streaming-message';
        }
        
        messageDiv.className = 'flex flex-col mb-4 ' + (role === 'user' ? 'items-end' : 'items-start');
        
        // Prepare image HTML if image is present
        let imageHtml = '';
        if (imageData) {
            imageHtml = `
                <div class="message-image mb-2">
                    <img src="data:image/jpeg;base64,${imageData}" alt="User uploaded image" 
                         class="rounded-md max-w-full max-h-60 object-cover">
                </div>
            `;
        }
        
        // Add typing indicator for streaming messages
        let typingIndicator = '';
        if (isStreaming) {
            typingIndicator = `
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            `;
        }
        
        messageDiv.innerHTML = `
            <div class="message message-${role === 'user' ? 'user' : 'ai'} px-4 py-3 max-w-[80%]">
                ${imageHtml}
                <div class="message-content">${content ? formatMessageContent(content) : ''}</div>
                ${isStreaming ? typingIndicator : ''}
                <div class="text-xs text-gray-500 mt-1">${timestamp}</div>
            </div>
        `;
        
        // For streaming messages, replace existing streaming message if it exists
        if (isStreaming) {
            const existingStreamingMessage = document.getElementById('streaming-message');
            if (existingStreamingMessage) {
                conversationContainer.replaceChild(messageDiv, existingStreamingMessage);
            } else {
                conversationContainer.appendChild(messageDiv);
            }
        } else {
            conversationContainer.appendChild(messageDiv);
        }
        
        scrollToBottom();
    }
    
    /**
     * Format message content (handle URLs, line breaks, code blocks, etc.)
     */
    function formatMessageContent(content) {
        // Convert URLs to links
        content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        
        // Handle code blocks with ```
        content = content.replace(/```(\w*)\n([\s\S]*?)\n```/g, function(match, language, codeContent) {
            const languageClass = language ? `language-${language}` : '';
            const escapedCode = codeContent
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
                
            return `
                <div class="code-block bg-gray-800 dark:bg-gray-900 rounded-md my-2 relative">
                    <div class="code-header flex justify-between items-center p-2 bg-gray-700 dark:bg-gray-800 rounded-t-md">
                        <span class="text-xs text-gray-300">${language || 'code'}</span>
                        <button class="copy-code-btn bg-primary-600 hover:bg-primary-700 text-white text-xs rounded px-2 py-1" 
                                onclick="copyToClipboard(this)" data-clipboard-text="${escapedCode}">
                            <i class="fas fa-clipboard mr-1"></i>Copy
                        </button>
                    </div>
                    <pre class="text-gray-200 p-4 overflow-x-auto"><code class="${languageClass}">${escapedCode}</code></pre>
                </div>
            `;
        });
        
        // Handle inline code with single backticks
        content = content.replace(/`([^`]+)`/g, '<code class="bg-gray-700 dark:bg-gray-800 rounded px-1 py-0.5 text-sm">$1</code>');
        
        // Convert regular line breaks to <br> (after handling code blocks)
        return content.replace(/\n/g, '<br>');
    }
    
    /**
     * Copy code to clipboard
     * @param {HTMLElement} button - The copy button that was clicked
     */
    function copyToClipboard(button) {
        const codeText = button.getAttribute('data-clipboard-text');
        
        // Update button appearance immediately
        const originalText = button.innerHTML;
        button.disabled = true;
        
        // Try to use modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(codeText)
                .then(() => {
                    // Success feedback
                    button.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
                    button.classList.remove('bg-primary-600', 'hover:bg-primary-700');
                    button.classList.add('bg-green-600', 'hover:bg-green-700');
                    
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.classList.remove('bg-green-600', 'hover:bg-green-700');
                        button.classList.add('bg-primary-600', 'hover:bg-primary-700');
                        button.disabled = false;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Could not copy text with Clipboard API: ', err);
                    // Fallback to execCommand
                    fallbackCopyToClipboard(codeText, button, originalText);
                });
        } else {
            // Fallback for browsers without clipboard API
            fallbackCopyToClipboard(codeText, button, originalText);
        }
    }
    
    /**
     * Fallback method for copying to clipboard using execCommand
     */
    function fallbackCopyToClipboard(text, button, originalText) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';  // Avoid scrolling to bottom
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                // Success feedback
                button.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
                button.classList.remove('bg-primary-600', 'hover:bg-primary-700');
                button.classList.add('bg-green-600', 'hover:bg-green-700');
            } else {
                button.innerHTML = '<i class="fas fa-times mr-1"></i>Failed';
                button.classList.remove('bg-primary-600', 'hover:bg-primary-700');
                button.classList.add('bg-red-600', 'hover:bg-red-700');
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
            button.innerHTML = '<i class="fas fa-times mr-1"></i>Failed';
            button.classList.remove('bg-primary-600', 'hover:bg-primary-700');
            button.classList.add('bg-red-600', 'hover:bg-red-700');
        }
        
        document.body.removeChild(textArea);
        
        // Reset button after delay
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('bg-green-600', 'hover:bg-green-700', 'bg-red-600', 'hover:bg-red-700');
            button.classList.add('bg-primary-600', 'hover:bg-primary-700');
            button.disabled = false;
        }, 2000);
    }
    
    // Make copyToClipboard available globally
    window.copyToClipboard = copyToClipboard;
    
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
     * @param {string} role - 'user' or 'assistant'
     * @param {string} content - Message text content
     * @param {string|null} imageData - Base64 encoded image data (optional)
     */
    function addToConversation(role, content, imageData = null) {
        const messageObj = { 
            role, 
            content, 
            timestamp: new Date().toISOString() 
        };
        
        // Only add image data if it exists (to save space in localStorage)
        if (imageData) {
            messageObj.image_data = imageData;
        }
        
        conversation.push(messageObj);
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
                            // Check if message has image data from the database
                            const hasImage = msg.has_image || false;
                            
                            // If message has image, we need to fetch it separately
                            if (hasImage) {
                                // We'll fetch the image data and then display the message
                                fetch(`/api/messages/${msg.id}/image?user_id=${userId}`)
                                    .then(response => response.json())
                                    .then(imageData => {
                                        if (imageData.status === 'success') {
                                            // Add message with image to UI
                                            addMessageToUI(msg.role, msg.content, imageData.image_data);
                                            
                                            // Add to conversation history with image
                                            conversation.push({
                                                role: msg.role,
                                                content: msg.content,
                                                image_data: imageData.image_data,
                                                timestamp: msg.timestamp
                                            });
                                            
                                            // Save updated conversation
                                            saveConversation();
                                        } else {
                                            // If image fetch fails, just show the message without image
                                            addMessageToUI(msg.role, msg.content);
                                            conversation.push({
                                                role: msg.role,
                                                content: msg.content,
                                                timestamp: msg.timestamp
                                            });
                                        }
                                    })
                                    .catch(error => {
                                        console.error('Error fetching image data:', error);
                                        // Still show message without image
                                        addMessageToUI(msg.role, msg.content);
                                        conversation.push({
                                            role: msg.role,
                                            content: msg.content,
                                            timestamp: msg.timestamp
                                        });
                                    });
                            } else {
                                // Regular message without image
                                addMessageToUI(msg.role, msg.content);
                                conversation.push({
                                    role: msg.role,
                                    content: msg.content,
                                    timestamp: msg.timestamp
                                });
                            }
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
     * @param {string} message - The user's message text
     * @param {string|null} imageData - Optional base64 encoded image data
     * @param {boolean} useStreaming - Whether to use streaming for the response
     * @param {string|null} reasoningEffort - Optional reasoning effort level (low, medium, high)
     * @param {string|null} developerMessage - Optional developer message (like system message)
     * @param {string|null} model - Optional model deployment ID to use
     */
    function getAIResponse(message, imageData = null, useStreaming = false, reasoningEffort = null, developerMessage = null, model = null) {
        const userId = localStorage.getItem('user_id');
        
        // Hide any existing typing indicators
        hideTypingIndicator();
        
        // Hide welcome message if visible
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
        
        if (useStreaming) {
            // For streaming, we use server-sent events
            // Add an empty assistant message with streaming indicator
            addMessageToUI('assistant', '', null, true);
            
            // Instead of passing everything in the URL, let's create a dedicated streaming endpoint
            const eventSource = new EventSource(`/api/chat/stream?user_id=${userId || ''}`);
            
            // For streaming, we still need to post the message data to the server
            // Let's keep the original approach for actually sending the message
            fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    username: username || '',
                    user_id: userId || '',
                    image_data: imageData,
                    conversation_history: conversation,
                    streaming: true,
                    reasoning_effort: reasoningEffort,
                    developer_message: developerMessage,
                    model: model
                }),
            }).catch(error => {
                console.error('Error sending streaming message:', error);
                eventSource.close();
                hideTypingIndicator();
                showError('Error starting streaming response: ' + error.message);
                isWaitingForResponse = false;
            });
            
            // Handle connection open
            eventSource.onopen = function() {
                console.log('EventSource connection established');
            };
            
            let fullResponse = '';
            let streamingMessageElement = document.getElementById('streaming-message');
            
            // Handle incoming message chunks
            eventSource.onmessage = function(event) {
                const data = JSON.parse(event.data);
                
                if (data.chunk) {
                    fullResponse += data.chunk;
                    
                    // Update the streaming message with the latest content
                    if (streamingMessageElement) {
                        const messageContent = streamingMessageElement.querySelector('.message-content');
                        if (messageContent) {
                            messageContent.innerHTML = formatMessageContent(fullResponse);
                            scrollToBottom();
                        }
                    }
                }
                
                // Check if this is the final message
                if (data.is_final) {
                    eventSource.close();
                    isWaitingForResponse = false;
                    
                    // Replace the streaming message with a final one
                    if (streamingMessageElement) {
                        streamingMessageElement.removeAttribute('id');
                        const typingIndicator = streamingMessageElement.querySelector('.typing-indicator');
                        if (typingIndicator) {
                            typingIndicator.remove();
                        }
                    }
                    
                    // Add to conversation history
                    addToConversation('assistant', fullResponse);
                    
                    // Handle reasoning summary if available
                    if (data.reasoning_summary) {
                        // Display reasoning summary in a special format
                        addReasoningSummary(data.reasoning_summary);
                    }
                }
            };
            
            // Handle errors with more detailed messaging and retry logic
            eventSource.onerror = function(error) {
                console.error('EventSource error:', error);
                
                // Always close the connection on error
                eventSource.close();
                hideTypingIndicator();
                
                // Check if Azure OpenAI credentials are missing
                if (error && error.target && error.target.readyState === EventSource.CLOSED) {
                    showError('Connection closed: The server could not process your request. This may be due to missing or invalid API credentials.');
                } else {
                    showError('Connection error: Unable to stream the response. Switching to non-streaming mode...');
                    
                    // Fall back to non-streaming mode after a short delay
                    setTimeout(() => {
                        if (isWaitingForResponse) {
                            getAIResponse(message, imageData, false, reasoningEffort, developerMessage, model);
                        }
                    }, 1000);
                }
                
                isWaitingForResponse = false;
            };
        } else {
            // For non-streaming responses, use regular fetch
            fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    username: username,
                    user_id: userId,
                    image_data: imageData,
                    conversation_history: conversation,
                    streaming: false,
                    reasoning_effort: reasoningEffort,
                    developer_message: developerMessage,
                    model: model
                }),
            })
            .then(response => response.json())
            .then(data => {
                hideTypingIndicator();
                
                if (data.status === 'success') {
                    // Add AI response to UI
                    addMessageToUI('assistant', data.response);
                    
                    // Add to conversation history
                    addToConversation('assistant', data.response);
                    
                    // Handle reasoning summary if available
                    if (data.reasoning_summary) {
                        // Display reasoning summary in a special format
                        addReasoningSummary(data.reasoning_summary);
                    }
                } else {
                    // Show error
                    showError(data.message || 'An error occurred while getting a response.');
                }
                
                isWaitingForResponse = false;
            })
            .catch(error => {
                hideTypingIndicator();
                showError('Network error: Could not connect to the server.');
                console.error('Error:', error);
                isWaitingForResponse = false;
            });
        }
    }
    
    /**
     * Display a reasoning summary in the conversation
     */
    function addReasoningSummary(summary) {
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'bg-primary-900/30 text-primary-100 border border-primary-700 rounded-md p-3 my-2 mx-4';
        
        // Create heading
        const heading = document.createElement('div');
        heading.className = 'font-medium text-sm mb-1 flex items-center';
        heading.innerHTML = '<i class="fas fa-brain mr-2"></i> Reasoning Summary';
        
        // Create content
        const content = document.createElement('div');
        content.className = 'text-sm opacity-90';
        content.textContent = summary;
        
        // Add elements to the summary div
        summaryDiv.appendChild(heading);
        summaryDiv.appendChild(content);
        
        // Add to conversation container
        conversationContainer.appendChild(summaryDiv);
        scrollToBottom();
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
        
        // Toggle the 'dark' class on the html element
        document.documentElement.classList.toggle('dark', currentTheme === 'dark');
        
        // Save theme preference to localStorage
        localStorage.setItem('theme', currentTheme);
        
        // Update UI
        updateThemeIcon();
        
        console.log('Theme toggled to:', currentTheme);
    }
    
    /**
     * Update theme toggle icon based on current theme
     */
    function updateThemeIcon() {
        const icons = document.querySelectorAll('.theme-toggle i');
        icons.forEach(icon => {
            // Instead of replacing the entire className, just update the icon
            // Remove both icon classes
            icon.classList.remove('fa-sun', 'fa-moon');
            // Add the appropriate icon class
            if (currentTheme === 'dark') {
                icon.classList.add('fa-sun');
            } else {
                icon.classList.add('fa-moon');
            }
            // Make sure the base 'fas' class is always present
            if (!icon.classList.contains('fas')) {
                icon.classList.add('fas');
            }
        });
    }
    
    /**
     * Toggle the advanced options panel
     */
    function toggleAdvancedOptions() {
        showAdvancedOptions = !showAdvancedOptions;
        
        if (showAdvancedOptions) {
            advancedOptionsPanel.classList.remove('hidden');
            advancedOptionsIcon.classList.remove('fa-chevron-down');
            advancedOptionsIcon.classList.add('fa-chevron-up');
        } else {
            advancedOptionsPanel.classList.add('hidden');
            advancedOptionsIcon.classList.remove('fa-chevron-up');
            advancedOptionsIcon.classList.add('fa-chevron-down');
        }
    }
    
    /**
     * Get the selected reasoning effort value
     */
    function getSelectedReasoningEffort() {
        for (const radio of reasoningEffortRadios) {
            if (radio.checked) {
                return radio.value;
            }
        }
        return 'medium'; // Default to medium if nothing selected
    }
    
    /**
     * Handle image upload
     */
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check file type
        if (!file.type.match('image.*')) {
            alert('Please select an image file.');
            return;
        }
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB.');
            return;
        }
        
        // Create FormData
        const formData = new FormData();
        formData.append('image', file);
        
        // Show loading state
        imagePreviewContainer.style.display = 'flex';
        imagePreview.src = '';
        imagePreview.alt = 'Loading...';
        
        // Upload image to server
        fetch('/api/upload-image', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Store image data and show preview
                imageData = data.image_data;
                imagePreview.src = `data:image/jpeg;base64,${imageData}`;
                imagePreview.alt = 'Image Preview';
                imagePreviewContainer.style.display = 'flex';
            } else {
                // Show error
                alert('Error uploading image: ' + (data.message || 'Unknown error'));
                clearImageUpload();
            }
        })
        .catch(error => {
            console.error('Error uploading image:', error);
            alert('Network error: Could not upload image.');
            clearImageUpload();
        });
    }
    
    /**
     * Clear image upload and preview
     */
    function clearImageUpload() {
        imageData = null;
        imageUploadInput.value = '';
        imagePreviewContainer.style.display = 'none';
        imagePreview.src = '#';
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
