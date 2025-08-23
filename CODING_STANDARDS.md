# Coding Standards & Best Practices

## Table of Contents
1. [General Principles](#general-principles)
2. [JavaScript/Node.js Standards](#javascriptnodejs-standards)
3. [React Standards](#react-standards)
4. [File Organization](#file-organization)
5. [Naming Conventions](#naming-conventions)
6. [Code Formatting](#code-formatting)
7. [Error Handling](#error-handling)
8. [Security Best Practices](#security-best-practices)
9. [Performance Guidelines](#performance-guidelines)
10. [Testing Standards](#testing-standards)

## General Principles

- **Consistency**: Maintain consistent patterns across the entire codebase
- **Readability**: Write code that is easy to read and understand
- **Maintainability**: Structure code for easy maintenance and updates
- **Performance**: Write efficient code without premature optimization
- **Security**: Follow security best practices at all times

## JavaScript/Node.js Standards

### Import/Export Order
```javascript
// 1. Built-in Node.js modules
import fs from 'fs';
import path from 'path';

// 2. Third-party packages
import express from 'express';
import mongoose from 'mongoose';

// 3. Local modules (with blank line separator)
import User from '../models/User.js';
import { validateUser } from '../utils/validators.js';
```

### Variable Declarations
```javascript
// ✅ Good
const user = await User.findById(id);
let isActive = false;

// ❌ Bad
var user = await User.findById(id);
let isActive = false;
```

### Function Declarations
```javascript
// ✅ Good - Arrow functions for expressions
const getUser = async (id) => {
  return await User.findById(id);
};

// ✅ Good - Function declarations for named functions
function validateUserData(userData) {
  // validation logic
}

// ✅ Good - Async functions
const createUser = async (userData) => {
  try {
    const user = new User(userData);
    return await user.save();
  } catch (error) {
    throw new Error('Failed to create user');
  }
};
```

### Error Handling
```javascript
// ✅ Good - Consistent error handling
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', { error: error.message });
  throw new Error('Operation failed');
}

// ❌ Bad - Inconsistent error handling
try {
  const result = await someAsyncOperation();
  return result;
} catch (err) {
  console.log(err);
  return null;
}
```

## React Standards

### Component Structure
```jsx
// ✅ Good - Consistent component structure
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const UserProfile = ({ userId, onUpdate }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const userData = await api.getUser(userId);
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};

UserProfile.propTypes = {
  userId: PropTypes.string.isRequired,
  onUpdate: PropTypes.func,
};

export default UserProfile;
```

### Hooks Usage
```jsx
// ✅ Good - Custom hooks for reusable logic
const useUser = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const userData = await api.getUser(userId);
        setUser(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading, error };
};
```

## File Organization

### Directory Structure
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components
│   ├── forms/          # Form components
│   └── layout/         # Layout components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── api/                # API client functions
├── constants/          # Application constants
├── types/              # TypeScript types (if applicable)
└── styles/             # Global styles
```

### File Naming
```javascript
// ✅ Good - PascalCase for components
UserProfile.jsx
ProductCard.jsx
NavigationBar.jsx

// ✅ Good - camelCase for utilities
formatDate.js
validateEmail.js
apiClient.js

// ✅ Good - kebab-case for CSS files
user-profile.css
product-card.css
```

## Naming Conventions

### Variables and Functions
```javascript
// ✅ Good - Descriptive names
const userEmail = 'john@example.com';
const isUserLoggedIn = true;
const getUserById = async (id) => { /* ... */ };

// ❌ Bad - Unclear names
const email = 'john@example.com';
const loggedIn = true;
const get = async (id) => { /* ... */ };
```

### Constants
```javascript
// ✅ Good - UPPER_SNAKE_CASE for constants
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 5000;

// ✅ Good - camelCase for configuration objects
const config = {
  apiUrl: process.env.API_URL,
  timeout: 5000,
  retries: 3,
};
```

## Code Formatting

### Indentation and Spacing
```javascript
// ✅ Good - Consistent 2-space indentation
function processUser(user) {
  if (!user) {
    return null;
  }

  const processedUser = {
    id: user.id,
    name: user.name.trim(),
    email: user.email.toLowerCase(),
  };

  return processedUser;
}

// ❌ Bad - Inconsistent spacing
function processUser(user){
if(!user){
return null;
}
const processedUser={id:user.id,name:user.name.trim(),email:user.email.toLowerCase()};
return processedUser;
}
```

### Line Length
- Maximum line length: 80 characters
- Break long lines at logical points
- Use template literals for long strings

```javascript
// ✅ Good - Breaking long lines
const errorMessage = 
  'This is a very long error message that needs to be broken ' +
  'into multiple lines for better readability';

// ✅ Good - Using template literals
const errorMessage = `
  This is a very long error message that needs to be broken 
  into multiple lines for better readability
`;
```

## Error Handling

### API Error Handling
```javascript
// ✅ Good - Consistent error response format
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      message: data.message || 'An error occurred',
      status,
      code: data.code,
    };
  } else if (error.request) {
    // Request made but no response
    return {
      message: 'No response from server',
      status: 0,
      code: 'NETWORK_ERROR',
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: 500,
      code: 'UNKNOWN_ERROR',
    };
  }
};
```

### Validation Errors
```javascript
// ✅ Good - Structured validation errors
const validateUser = (userData) => {
  const errors = {};

  if (!userData.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(userData.email)) {
    errors.email = 'Invalid email format';
  }

  if (!userData.password) {
    errors.password = 'Password is required';
  } else if (userData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
```

## Security Best Practices

### Input Validation
```javascript
// ✅ Good - Always validate and sanitize input
const sanitizeUserInput = (input) => {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000);  // Limit length
};

// ✅ Good - Use parameterized queries
const getUserById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid user ID');
  }
  
  return await User.findById(id);
};
```

### Authentication & Authorization
```javascript
// ✅ Good - Check permissions before operations
const updateUser = async (req, res) => {
  const { userId } = req.params;
  const { user: currentUser } = req;

  // Check if user can update this profile
  if (currentUser.id !== userId && !currentUser.isAdmin) {
    return res.status(403).json({ 
      message: 'Insufficient permissions' 
    });
  }

  // Proceed with update
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
};
```

## Performance Guidelines

### React Performance
```jsx
// ✅ Good - Memoize expensive calculations
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: heavyProcessing(item),
    }));
  }, [data]);

  return <div>{/* render processed data */}</div>;
});

// ✅ Good - Use callback refs for DOM measurements
const MeasuredComponent = () => {
  const [dimensions, setDimensions] = useState({});
  const elementRef = useCallback((node) => {
    if (node) {
      setDimensions({
        width: node.offsetWidth,
        height: node.offsetHeight,
      });
    }
  }, []);

  return <div ref={elementRef}>Content</div>;
};
```

### Backend Performance
```javascript
// ✅ Good - Use database indexes and efficient queries
const getUsersWithPagination = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    User.find({})
      .select('name email createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments({}),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};
```

## Testing Standards

### Unit Tests
```javascript
// ✅ Good - Comprehensive test coverage
describe('User Model', () => {
  describe('validation', () => {
    it('should validate a valid user', () => {
      const validUser = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      const validationResult = validUser.validateSync();
      expect(validationResult).toBeUndefined();
    });

    it('should require email', () => {
      const userWithoutEmail = new User({
        name: 'John Doe',
        password: 'password123',
      });

      const validationResult = userWithoutEmail.validateSync();
      expect(validationResult.errors.email).toBeDefined();
    });
  });
});
```

### Integration Tests
```javascript
// ✅ Good - Test API endpoints
describe('User API', () => {
  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(userData.email);
    });
  });
});
```

## Code Review Checklist

Before submitting code for review, ensure:

- [ ] Code follows all naming conventions
- [ ] Proper error handling is implemented
- [ ] Input validation is in place
- [ ] Security best practices are followed
- [ ] Performance considerations are addressed
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] No console.log statements remain
- [ ] Code is properly formatted
- [ ] No unused imports or variables
- [ ] Proper TypeScript types (if applicable)

## Tools and Automation

### Pre-commit Hooks
- ESLint for code quality
- Prettier for code formatting
- Husky for git hooks
- lint-staged for staged files

### CI/CD Pipeline
- Automated testing on all branches
- Code quality checks
- Security scanning
- Performance testing

## Conclusion

Following these coding standards ensures:
- Consistent code quality across the team
- Easier maintenance and debugging
- Better collaboration and code reviews
- Improved application performance and security
- Reduced technical debt

Remember: **Consistency is more important than perfection**. When in doubt, follow the established patterns in the codebase.
