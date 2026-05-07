# Prediction Market Workflow (TypeScript)

This template provides a blank TypeScript workflow example. It aims to give a starting point for writing a workflow from scratch and to get started with local simulation.

Steps to run the example

## 1. Update .env file

You need to add a private key to env file. 

This is specifically required if you want to simulate chain writes. 

## 2. Install dependencies
```bash
bun install
```

## 3. Simulate the workflow
Run the command from <b>project root directory</b>

```bash
cre workflow simulate <path-to-workflow> --target=staging-settings
```
