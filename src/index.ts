#!/usr/bin/env node
import chalk from 'chalk';
import fs from 'fs/promises';
import os from 'os';

const helpText = `Usage:
task-cli <command> [args]

Commands:
\t- ${chalk.green('add "<task>"')}
\t- ${chalk.green('update <task-id> "<new-task>"')}
\t- ${chalk.green('delete <task-id>')}
\t- ${chalk.green('mark-in-progress <task-id>')}
\t- ${chalk.green('mark-done <task-id>')}
\t- ${chalk.green('list [<none>|todo|in-progress|done]')}`;

enum Command {
  ADD = 'ADD',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  IN_PROGRESS = 'MARK-IN-PROGRESS',
  DONE = 'MARK-DONE',
  LIST = 'LIST',
}

interface Task {
  id: string;
  task: string;
  status: TaskStatus;
}

enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

const isCommand = (arg: string): arg is Command =>
  Object.values(Command).includes(arg.toUpperCase() as Command);

const isTaskStatus = (arg: string): arg is TaskStatus =>
  Object.values(TaskStatus).includes(arg.toUpperCase() as TaskStatus);

const start = async () => {
  const command = process.argv[2];

  // Check if the command is provided
  if (!command) {
    console.log(helpText);
    return;
  }

  // Check if the command is valid
  if (!isCommand(command)) {
    console.log(chalk.red('Invalid command'));
    console.log(helpText);
    return;
  }

  const filePath = `${os.homedir()}/tasks.json`;

  try {
    await fs.access(filePath);
  } catch (error) {
    const file = await fs.open(filePath, 'w');
    await file.writeFile('{"tasks":[]}', { encoding: 'utf-8' });
  }

  const data = await fs.readFile(filePath, { encoding: 'utf-8' });
  let { tasks } = JSON.parse(data) as { tasks: Task[] };

  switch (command.toUpperCase()) {
    case Command.ADD:
      if (!process.argv[3]) {
        console.log(chalk.red('Task name is required'));
        console.log(helpText);
        return;
      }

      const id = Math.random().toString(36).slice(2, 9);
      const taskName = process.argv[3];
      try {
        tasks = [...tasks, { id, task: taskName, status: TaskStatus.TODO }];
        console.log(chalk.green(`Task added successfully (ID: ${id})`));
      } catch (error) {
        console.log(chalk.red('An error occurred'));
        console.log(error);
      }
      break;
    case Command.UPDATE:
      if (!process.argv[3] || !process.argv[4]) {
        console.log(chalk.red('Task ID and task name are required'));
        console.log(helpText);
        return;
      }

      const taskId = process.argv[3];
      const newTaskName = process.argv[4];

      try {
        const taskToUpdate = tasks.find((task) => task.id === taskId);

        if (!taskToUpdate) {
          console.log(chalk.red(`Task not found (ID: ${taskId})`));
          return;
        }

        tasks = tasks.map((task) =>
          task.id === taskId ? { ...task, task: newTaskName } : task
        );
        console.log(chalk.green(`Task updated successfully (ID: ${taskId})`));
      } catch (error) {
        console.log(chalk.red('An error occurred'));
        console.log(error);
      }

      break;
    case Command.DELETE:
      if (!process.argv[3]) {
        console.log(chalk.red('Task ID is required'));
        console.log(helpText);
        return;
      }

      const taskIdToDelete = process.argv[3];

      try {
        tasks = tasks.filter((task) => task.id !== taskIdToDelete);
        console.log(
          chalk.green(`Task deleted successfully (ID: ${taskIdToDelete})`)
        );
      } catch (error) {
        console.log(chalk.red('An error occurred'));
        console.log(error);
      }

      break;
    case Command.IN_PROGRESS:
      if (!process.argv[3]) {
        console.log(chalk.red('Task ID is required'));
        console.log(helpText);
        return;
      }

      const taskIdToMarkInProgress = process.argv[3];

      try {
        const taskToMarkInProgress = tasks.find(
          (task) => task.id === taskIdToMarkInProgress
        );

        if (!taskToMarkInProgress) {
          console.log(
            chalk.red(`Task not found (ID: ${taskIdToMarkInProgress})`)
          );
          return;
        }

        tasks = tasks.map((task) =>
          task.id === taskIdToMarkInProgress
            ? { ...task, status: TaskStatus.IN_PROGRESS }
            : task
        );
        console.log(
          chalk.green(
            `Task marked as in-progress successfully (ID: ${taskIdToMarkInProgress})`
          )
        );
      } catch (error) {
        console.log(chalk.red('An error occurred'));
        console.log(error);
      }

      break;
    case Command.DONE:
      if (!process.argv[3]) {
        console.log(chalk.red('Task ID is required'));
        console.log(helpText);
        return;
      }

      const taskIdToMarkDone = process.argv[3];

      try {
        const taskToMarkDone = tasks.find(
          (task) => task.id === taskIdToMarkDone
        );

        if (!taskToMarkDone) {
          console.log(chalk.red(`Task not found (ID: ${taskIdToMarkDone})`));
          return;
        }

        tasks = tasks.map((task) =>
          task.id === taskIdToMarkDone
            ? { ...task, status: TaskStatus.DONE }
            : task
        );
        console.log(
          chalk.green(
            `Task marked as done successfully (ID: ${taskIdToMarkDone})`
          )
        );
      } catch (error) {
        console.log(chalk.red('An error occurred'));
        console.log(error);
      }

      break;
    case Command.LIST:
      if (!process.argv[3]) {
        console.log(chalk.green('Tasks:'));
        tasks.length
          ? tasks.forEach((task) =>
              console.log(`\t- ${task.task} (ID: ${task.id}): ${task.status}`)
            )
          : console.log('\t- No tasks');
        return;
      }

      const status = process.argv[3].toUpperCase();

      if (!isTaskStatus(status)) {
        console.log(chalk.red('Invalid status'));
        console.log(helpText);
        return;
      }

      console.log(chalk.green(`Tasks with ${status} status:`));
      const tasksByStatus = tasks.filter((task) => task.status === status);

      tasksByStatus.length
        ? tasksByStatus.forEach((task) =>
            console.log(`\t- ${task.task} (ID: ${task.id}): ${task.status}`)
          )
        : console.log('\t- No tasks');

      break;
  }

  await fs.writeFile(filePath, `{"tasks":${JSON.stringify(tasks)}}`, {
    encoding: 'utf-8',
    flag: 'w',
  });
};

start();
