import { NextRequest, NextResponse } from 'next/server';
import { productionReadinessAssessor } from '@/lib/integration/productionReadinessAssessor';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('assessmentId');
    const category = searchParams.get('category');

    if (assessmentId) {
      // Get specific assessment
      const assessment = productionReadinessAssessor.getAssessment(assessmentId);
      if (!assessment) {
        return NextResponse.json({
          success: false,
          error: 'Assessment not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: assessment
      });
    } else if (category) {
      // Get criteria by category
      const criteria = productionReadinessAssessor.getCriteriaByCategory(category as any);
      return NextResponse.json({
        success: true,
        data: criteria,
        count: criteria.length
      });
    } else {
      // Get latest assessment or all assessments
      const latest = productionReadinessAssessor.getLatestAssessment();
      const all = productionReadinessAssessor.getAllAssessments();
      
      return NextResponse.json({
        success: true,
        data: {
          latest,
          all,
          count: all.length
        }
      });
    }

  } catch (error) {
    console.error('Error fetching readiness data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch readiness data'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { action, criteriaId, score, details } = body;

    if (action === 'run-assessment') {
      // Run production readiness assessment
      const assessment = await productionReadinessAssessor.runAssessment(user.id);
      return NextResponse.json({
        success: true,
        data: assessment,
        message: 'Production readiness assessment completed'
      });
    } else if (action === 'update-criteria' && criteriaId && score !== undefined) {
      // Update criteria score
      const success = productionReadinessAssessor.updateCriteriaScore(criteriaId, score, details || '');
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Criteria score updated successfully'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Failed to update criteria score'
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action or missing parameters'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error processing readiness request:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process readiness request'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });
