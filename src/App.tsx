/* eslint-disable jsx-a11y/control-has-associated-label */
import React, {
  useContext, useEffect, useState,
} from 'react';
import {
  deleteTodo, getCompletedTodos, getTodos, postTodo,
} from './api/todos';
import { AuthContext } from './components/Auth/AuthContext';
import { ErrorMessage } from './components/ErrorMessage';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ToDoList } from './components/ToDoList';
import { ErrorType } from './types/Error';
import { Filter } from './types/Filter';
import { Todo } from './types/Todo';

export const App: React.FC = () => {
  const user = useContext(AuthContext);
  const [visibleToDos, setVisibleToDos] = useState<Todo[]>([]);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [filter, setFilter] = useState(Filter.All);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [requestCount, setRequestCount] = useState(0);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [deletingToDoId, setDeletingToDoId] = useState<number[]>([]);

  const handleErrorClose = () => setErrorType(null);

  const getSelectedTodos = (todos: Todo[]) => {
    const filteredTodos = todos.filter(({ completed }) => {
      switch (filter) {
        case Filter.Active:
          return !completed;

        case Filter.Completed:
          return completed;

        default:
          return true;
      }
    });

    setVisibleToDos(filteredTodos);
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();

    if (user && newTodoTitle) {
      setErrorType(null);
      setIsAdding(true);

      const newToDo: Todo = {
        userId: user.id,
        title: newTodoTitle,
        completed: false,
      };

      setTempTodo({
        ...newToDo,
        id: 0,
      });

      postTodo(newToDo)
        .then(() => setNewTodoTitle(''))
        .catch(() => setErrorType(ErrorType.Add))
        .finally(() => setRequestCount((curr) => curr + 1));
    }
  };

  const handleRemoveTodo = (todoId: number) => {
    if (user) {
      setErrorType(null);
      setDeletingToDoId(curr => [...curr, todoId]);

      deleteTodo(todoId)
        .catch(() => setErrorType(ErrorType.Delete))
        .finally(() => setRequestCount((curr) => curr + 1));
    }
  };

  const handleClearCompleted = () => {
    if (user) {
      getCompletedTodos(user.id)
        .then(todos => {
          const idS = todos.map(({ id = 0 }) => id);

          setDeletingToDoId(idS);

          return idS;
        })
        .then(idS => Promise.all(idS.map(id => deleteTodo(id))))
        .catch(() => setErrorType(ErrorType.Delete))
        .finally(() => setRequestCount((curr) => curr + 1));
    }
  };

  useEffect(() => {
    setIsAdding(false);
    setTempTodo(null);
    setDeletingToDoId([]);
  }, [visibleToDos]);

  useEffect(() => {
    if (user) {
      getTodos(user.id)
        .then(toDos => {
          getSelectedTodos(toDos);
          setHasCompleted(toDos.some(({ completed }) => completed));
          setActiveCount(toDos.filter(({ completed }) => !completed).length);
        })
        .catch(() => setErrorType(ErrorType.Unexpected));
    }
  }, [filter, requestCount]);

  useEffect(() => {
    setTimeout(() => {
      setErrorType(null);
    }, 3000);
  }, [requestCount]);

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          newTodoTitle={newTodoTitle}
          onTitleChange={setNewTodoTitle}
          onToDoAdd={handleAddTodo}
          isAdding={isAdding}
        />

        <ToDoList
          todos={visibleToDos}
          tempTodo={tempTodo}
          onRemove={handleRemoveTodo}
          deletingToDoId={deletingToDoId}
        />

        {(activeCount || hasCompleted) && (
          <Footer
            hasCompleted={hasCompleted}
            activeCount={activeCount}
            onFilterChange={setFilter}
            filter={filter}
            onClearCompleted={handleClearCompleted}
          />
        )}
      </div>

      <ErrorMessage errorType={errorType} onErrorClose={handleErrorClose} />
    </div>
  );
};
