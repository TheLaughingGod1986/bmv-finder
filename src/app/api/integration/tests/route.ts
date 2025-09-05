import { NextRequest, NextResponse } from 'next/server';
import { systemIntegrationTester } from '@/lib/integration/systemIntegrationTester';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const testId = searchParams.get('testId');

    if (testId) {
      // Get specific test
      const test = systemIntegrationTester.getTest(testId);
      if (!test) {
        return NextResponse.json({
          success: false,
          error: 'Integration test not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: test
      });
    } else if (category) {
      // Get tests by category
      const tests = systemIntegrationTester.getTestsByCategory(category as any);
      return NextResponse.json({
        success: true,
        data: tests,
        count: tests.length
      });
    } else {
      // Get all tests
      const tests = systemIntegrationTester.getAllTests();
      return NextResponse.json({
        success: true,
        data: tests,
        count: tests.length
      });
    }

  } catch (error) {
    console.error('Error fetching integration tests:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch integration tests'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { testId, runAll } = body;

    if (runAll) {
      // Run all tests
      const results = await systemIntegrationTester.runAllTests();
      return NextResponse.json({
        success: true,
        data: results,
        count: results.length,
        message: 'All integration tests executed'
      });
    } else if (testId) {
      // Run specific test
      const result = await systemIntegrationTester.runTest(testId);
      if (!result) {
        return NextResponse.json({
          success: false,
          error: 'Integration test not found or failed to execute'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Integration test executed successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'testId or runAll parameter is required'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error running integration tests:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to run integration tests'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });
