import { NextRequest, NextResponse } from 'next/server';
import { testFramework } from '@/lib/testing/testFramework';
import { requireAuth } from '@/middleware/auth';

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { suiteId, testType } = body;

    let result;

    if (suiteId) {
      // Run specific test suite
      result = await testFramework.runTestSuite(suiteId);
    } else if (testType) {
      // Run all tests of specific type
      const allSuites = testFramework.getAllTestSuites();
      const filteredSuites = allSuites.filter(suite => 
        suite.tests.some(test => test.type === testType)
      );
      
      const results = [];
      for (const suite of filteredSuites) {
        const suiteResult = await testFramework.runTestSuite(suite.id);
        if (suiteResult) {
          results.push(suiteResult);
        }
      }
      result = results;
    } else {
      // Run all tests
      result = await testFramework.runAllTests();
    }

    if (result) {
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Tests executed successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to execute tests'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error running tests:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to run tests'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const suiteId = searchParams.get('suiteId');

    let data;

    if (suiteId) {
      // Get specific test suite
      data = testFramework.getTestSuite(suiteId);
      if (!data) {
        return NextResponse.json({
          success: false,
          error: 'Test suite not found'
        }, { status: 404 });
      }
    } else {
      // Get all test suites
      data = testFramework.getAllTestSuites();
    }

    return NextResponse.json({
      success: true,
      data,
      count: Array.isArray(data) ? data.length : 1
    });

  } catch (error) {
    console.error('Error fetching test data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch test data'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });