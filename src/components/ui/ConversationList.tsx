import React, { useState } from 'react';
import { MessageSquare, Search, Plus, MoreVertical, Trash2, Edit2, Calendar } from 'lucide-react';
import { Conversation } from '../../services/edgeFunctionChatService';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (conversationId: string) => void;
  onRenameConversation?: (conversationId: string, newTitle: string) => void;
  loading?: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversationId,
  onConversationSelect,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const filteredConversations = conversations.filter(conversation =>
    conversation.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    !conversation.title
  );

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return dateObj.toLocaleDateString();
    }
  };

  const truncateTitle = (title: string | undefined, maxLength: number = 40) => {
    if (!title) return 'New Chat';
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  const handleRename = (conversationId: string, currentTitle?: string) => {
    setEditingId(conversationId);
    setEditingTitle(currentTitle || '');
    setShowDropdown(null);
  };

  const handleRenameSubmit = () => {
    if (editingId && onRenameConversation && editingTitle.trim()) {
      onRenameConversation(editingId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleRenameCancel = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleDelete = (conversationId: string) => {
    if (onDeleteConversation && confirm('Are you sure you want to delete this conversation?')) {
      onDeleteConversation(conversationId);
    }
    setShowDropdown(null);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            Conversations
          </h2>
          <button
            onClick={onNewConversation}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="New conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewConversation}
                className="mt-2 text-brand-600 dark:text-brand-400 text-sm hover:underline"
              >
                Start your first chat
              </button>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`relative group p-3 rounded-lg cursor-pointer transition-all ${
                  currentConversationId === conversation.id
                    ? 'bg-brand-50 dark:bg-brand-900/20 border-l-2 border-brand-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => onConversationSelect(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 mr-2">
                    {editingId === conversation.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSubmit();
                          if (e.key === 'Escape') handleRenameCancel();
                        }}
                        onBlur={handleRenameSubmit}
                        className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-white"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {truncateTitle(conversation.title)}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(conversation.updated_at)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions Dropdown */}
                  {(onDeleteConversation || onRenameConversation) && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(showDropdown === conversation.id ? null : conversation.id);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {showDropdown === conversation.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                          {onRenameConversation && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRename(conversation.id, conversation.title);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Edit2 className="w-3 h-3" />
                              Rename
                            </button>
                          )}
                          {onDeleteConversation && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(conversation.id);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Active Indicator */}
                {currentConversationId === conversation.id && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-brand-500 rounded-r"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {filteredConversations.length > 0 && (
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default ConversationList;