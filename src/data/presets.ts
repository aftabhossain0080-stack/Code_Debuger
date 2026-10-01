import { DemoExample, ErrorExplanation } from '../types';

export const DEMO_EXAMPLES: DemoExample[] = [
  {
    id: 'js-typeerror',
    label: 'JavaScript: TypeError',
    language: 'JavaScript',
    error: "TypeError: Cannot read properties of undefined (reading 'name')",
  },
  {
    id: 'py-nameerror',
    label: "Python: NameError ('pd')",
    language: 'Python',
    error: "NameError: name 'pd' is not defined",
  },
  {
    id: 'py-indexerror',
    label: 'Python: IndexError',
    language: 'Python',
    error: 'IndexError: list index out of range',
  },
  {
    id: 'py-keyerror',
    label: "Python: KeyError ('age')",
    language: 'Python',
    error: "KeyError: 'age'",
  },
];

export const FALLBACK_EXPLANATIONS: Record<string, ErrorExplanation> = {
  "TypeError: Cannot read properties of undefined (reading 'name')": {
    errorType: 'TypeError',
    language: 'JavaScript',
    severity: 'Error',
    whatHappened: "You tried to access a property ('name') from an object reference that is currently undefined.",
    whyDidItHappen: "The object you expected to contain 'name' was not initialized, returned undefined from an async call, or does not exist.",
    howCanIFixIt: "Check that the object exists before accessing its property, or use optional chaining (?.) with a default value.",
    suggestedSolutionSummary: "Use optional chaining (?.) and nullish coalescing (??) to guard property access and provide a safe fallback value.",
    solution: {
      before: `// Problematic: Accessing nested property on uninitialized object
const user = undefined;

// This line throws: TypeError: Cannot read properties of undefined (reading 'name')
console.log(user.profile.name);`,
      after: `// Full corrected code with optional chaining & default fallback:
const user = undefined;

// Optional chaining (?.) safely short-circuits to undefined instead of crashing
const userName = user?.profile?.name ?? 'Default Guest';

console.log('User Name:', userName);`,
    },
    confidence: 'High',
  },
  "NameError: name 'pd' is not defined": {
    errorType: 'NameError',
    language: 'Python',
    severity: 'Error',
    whatHappened: "Python tried to use the identifier 'pd', but it has not been defined or imported in this script.",
    whyDidItHappen: "You are attempting to use Pandas via the standard abbreviation 'pd', but forgot to import the library first.",
    howCanIFixIt: "Add 'import pandas as pd' at the very top of your Python file.",
    suggestedSolutionSummary: "Import pandas with the alias pd and initialize data.",
    solution: {
      before: `# Problematic: Using pandas without importing it
data = {'id': [1, 2], 'name': ['Alice', 'Bob']}

# This throws NameError: name 'pd' is not defined
df = pd.DataFrame(data)
print(df)`,
      after: `# Full corrected working code:
import pandas as pd

# Sample structured data
data = {
    'id': [1, 2, 3],
    'name': ['Alice', 'Bob', 'Charlie']
}

# Successfully create DataFrame using imported pandas alias
df = pd.DataFrame(data)
print(df.head())`,
    },
    confidence: 'High',
  },
  'IndexError: list index out of range': {
    errorType: 'IndexError',
    language: 'Python',
    severity: 'Error',
    whatHappened: "You attempted to access an item at an index outside the boundaries of the list.",
    whyDidItHappen: "The requested index is greater than or equal to the total length of the list, or the list is empty.",
    howCanIFixIt: "Verify that the list is not empty and that the index is within range: 0 <= index < len(list).",
    suggestedSolutionSummary: "Add a boundary length check or check if the list contains elements before indexing.",
    solution: {
      before: `# Problematic: Direct index access on list without boundary check
numbers = [10, 20, 30]

# Accessing index 5 causes IndexError: list index out of range
target = numbers[5]
print(target)`,
      after: `# Full corrected code with boundary check and fallback:
numbers = [10, 20, 30]
target_index = 5

# Safe boundary check before accessing
if 0 <= target_index < len(numbers):
    target = numbers[target_index]
    print(f"Found element at index {target_index}: {target}")
else:
    print(f"Index {target_index} is out of bounds. Valid range: 0 to {len(numbers) - 1}.")`,
    },
    confidence: 'High',
  },
  "KeyError: 'age'": {
    errorType: 'KeyError',
    language: 'Python',
    severity: 'Error',
    whatHappened: "You tried to look up the key 'age' in a dictionary, but that key does not exist.",
    whyDidItHappen: "Direct bracket indexing user['age'] raises a KeyError when the key was never stored in the dictionary.",
    howCanIFixIt: "Use the dictionary .get('age', default_value) method to retrieve the value safely without raising an exception.",
    suggestedSolutionSummary: "Use dict.get() with a default fallback to prevent KeyError when keys are missing.",
    solution: {
      before: `# Problematic: Direct bracket access on missing dictionary key
user_profile = {
    'username': 'coder123',
    'email': 'coder@example.com'
}

# Raises KeyError: 'age'
user_value = user_profile['age']
print(user_value)`,
      after: `# Full corrected code with dict.get() and default value:
user_profile = {
    'username': 'coder123',
    'email': 'coder@example.com'
}

# Safely access key; returns fallback value if key does not exist
user_value = user_profile.get('age', 'Not provided')
print(f"User age: {user_value}")`,
    },
    confidence: 'High',
  },
};
