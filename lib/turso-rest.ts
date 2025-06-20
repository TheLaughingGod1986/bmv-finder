// lib/turso-rest.ts

export class TursoRest {
  useLocal = false;

  // Example method that executes a Turso query
  async executeTursoQuery(query: string, params?: any[]) {
    // Your existing implementation here
  }

  async queryDatabase(query: string, params?: any[]) {
    try {
      return await this.executeTursoQuery(query, params);
    } catch (error) {
      if (error instanceof Error) {
        console.log('Turso connection failed, falling back to local database:', error.message);
      } else {
        console.log('Turso connection failed, falling back to local database:', error);
      }
      this.useLocal = true;

      // Optional: you might want to handle fallback query here or rethrow
    }
  }

  // Other class methods ...
}