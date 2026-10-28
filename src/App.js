import { useEffect, useState } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_TODO_API_URL || 'http://localhost:7000';

const emptyForm = { name: '', date: '', description: '' };

async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    const contentType = response.headers.get('content-type') || '';
    const responseBody = contentType.includes('application/json') ? await response.json() : null;

    if (!response.ok) {
        const message = responseBody && responseBody.error ? responseBody.error : `Request failed with ${response.status}`;
        throw new Error(message);
    }

    return responseBody;
}

function formatDate(date) {
    if (!date) return 'No date';
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function TodoForm({ initialValues = emptyForm, submitLabel, onSubmit, onCancel }) {
    const [values, setValues] = useState(initialValues);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!values.name.trim()) return;

        setIsSubmitting(true);
        setSubmitError('');
        try {
            await onSubmit({ ...values, name: values.name.trim(), description: values.description.trim() });
            if (!onCancel) {
                setValues(emptyForm);
            }
        } catch (error) {
            setSubmitError(error.message || 'Could not save the to-do.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="todo-form" onSubmit={handleSubmit}>
            <label>
                Name
                <input
                    type="text"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    placeholder="What needs to be done?"
                    required
                />
            </label>
            <label>
                Date
                <input type="date" name="date" value={values.date} onChange={handleChange} />
            </label>
            <label>
                Description
                <textarea
                    name="description"
                    value={values.description}
                    onChange={handleChange}
                    placeholder="Add some details..."
                    rows={3}
                />
            </label>
            <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : submitLabel}
                </button>
                {onCancel && (
                    <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </button>
                )}
            </div>
            {submitError && <p className="error-message">{submitError}</p>}
        </form>
    );
}

function TodoCard({ todo, onUpdate, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <div className="card card-editing">
                <TodoForm
                    initialValues={{
                        name: todo.name,
                        date: todo.date,
                        description: todo.description,
                    }}
                    submitLabel="Save"
                    onSubmit={async (values) => {
                        await onUpdate(todo.id, values);
                        setIsEditing(false);
                    }}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        );
    }

    return (
        <div className="card">
            <h3 className="card-title">{todo.name}</h3>
            <span className="card-date">{formatDate(todo.date)}</span>
            <p className="card-description">{todo.description || 'No description'}</p>
            <div className="card-actions">
                <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                    Edit
                </button>
                <button className="btn btn-danger" onClick={() => onDelete(todo.id)}>
                    Delete
                </button>
            </div>
        </div>
    );
}

function App() {
    const [todos, setTodos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let mounted = true;

        const loadTodos = async () => {
            try {
                setErrorMessage('');
                const allTodos = await request('/todos');
                if (mounted) {
                    setTodos(allTodos);
                }
            } catch (error) {
                if (mounted) {
                    setErrorMessage(error.message || 'Could not load to-dos.');
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        loadTodos();
        return () => {
            mounted = false;
        };
    }, []);

    const addTodo = async (values) => {
        const created = await request('/todos', {
            method: 'POST',
            body: JSON.stringify(values),
        });
        setErrorMessage('');
        setTodos((prev) => [created, ...prev]);
    };

    const updateTodo = async (id, values) => {
        const updated = await request(`/todos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(values),
        });
        setErrorMessage('');
        setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    };

    const deleteTodo = async (id) => {
        try {
            await request(`/todos/${id}`, { method: 'DELETE' });
            setErrorMessage('');
            setTodos((prev) => prev.filter((t) => t.id !== id));
        } catch (error) {
            setErrorMessage(error.message || 'Could not delete the to-do.');
        }
    };

    return (
        <div className="App">
            <h1>To-Do List</h1>

            <section className="add-section">
                <h2>Add a new to-do</h2>
                <TodoForm submitLabel="Add to-do" onSubmit={addTodo} />
            </section>

            {errorMessage && <p className="error-message">{errorMessage}</p>}

            <section className="todo-list">
                {isLoading ? (
                    <p className="empty">Loading to-dos...</p>
                ) : todos.length === 0 ? (
                    <p className="empty">No to-dos yet. Add your first one above!</p>
                ) : (
                    todos.map((todo) => (
                        <TodoCard key={todo.id} todo={todo} onUpdate={updateTodo} onDelete={deleteTodo} />
                    ))
                )}
            </section>
        </div>
    );
}

export default App;