/**
 * Avatar Utility
 * Generates avatar URLs using UI Avatars service
 * Falls back to user-uploaded avatars if available
 */

export const getAvatarUrl = (user) => {
  // Return user's uploaded avatar if available
  if (user.avatar_url) {
    return user.avatar_url;
  }

  // Construct full name from available fields
  const name = user.name ||
               `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
               user.username ||
               'User';

  // Generate avatar using UI Avatars service
  // Background color matches app theme (#667eea)
  const params = new URLSearchParams({
    name: name,
    background: '667eea',
    color: 'fff',
    size: '128',
    bold: 'true',
    rounded: 'false'
  });

  return `https://ui-avatars.com/api/?${params.toString()}`;
};

/**
 * Get initials from user object for fallback display
 */
export const getUserInitials = (user) => {
  const name = user.name ||
               `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
               user.username ||
               'U';

  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
