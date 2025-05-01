using Crux.Data;
using Microsoft.EntityFrameworkCore;
using Crux.Models.Entities;

namespace Crux.Services;

public class TestService(
    ApplicationDbContext dbContext,
    IAuthenticationService authenticationService) : ITestService
{
    public bool ValidateQuestion(HttpContext context, int questionId, int answerId)
    {
        var userId = authenticationService.GetUserIdFromContext(context);
        
        if (!userId.HasValue)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }
        
        var user =  dbContext.Users.FirstOrDefault(x => x.Id == userId.Value);
        
        if (user == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return false;
        }
        
        var answer = dbContext
            .Answers
            .FirstOrDefault(x => x.Id == answerId &&  x.QuestionId == questionId);
        var isPreviouslyCompleted = dbContext.UserQuestionProgresses.Any(progress => progress.UserId == user.Id 
            && progress.QuestionId == questionId);

        if (answer != null && answer.IsCorrect)
        {
            if (!isPreviouslyCompleted)
            {
                user.ScorePoints += answer.Score;
                
                dbContext.UserQuestionProgresses.Add(new UserQuestionProgress
                {
                    UserId = user.Id,
                    QuestionId = questionId,
                });
            }
            
            dbContext.SaveChanges();
            return true;
        }
        
        return false;
    }
    
    public bool ValidateTask(HttpContext context, int taskId, ICollection<TaskData> inputData)
    {
        var userId = authenticationService.GetUserIdFromContext(context);
        
        if (!userId.HasValue)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }
        
        var user =  dbContext.Users.FirstOrDefault(x => x.Id == userId.Value);
        
        if (user == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return false;
        }

        var task = dbContext.Tasks
            .Include(t => t.ExpectedData)
            .FirstOrDefault(t => t.Id == taskId);
        var isPreviouslyCompleted = dbContext.UserTaskProgresses.Any(progress => progress.UserId == user.Id 
            && progress.TaskId == taskId);

        if (task == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return false;
        }

        if (task.ExpectedData.Count != inputData.Count)
        {
            return false;
        }

        //----Gemini magic starts here----//
        
        var comparer = new TaskDataValueComparer();

        var expectedCounts = task.ExpectedData
            .GroupBy(td => td, comparer)
            .ToDictionary(g => g.Key, g => g.Count(), comparer);

        var inputCounts = inputData
            .GroupBy(td => td, comparer)
            .ToDictionary(g => g.Key, g => g.Count(), comparer);
        
        bool areEqual = expectedCounts.Count == inputCounts.Count &&
                        expectedCounts.All(kvp => inputCounts.TryGetValue(kvp.Key, out var inputCount) &&
                                                  inputCount == kvp.Value);
        
        //----Gemini ends starts here----//

        if (areEqual)
        {
            if (!isPreviouslyCompleted)
            {
                user.ScorePoints += task.Points;
                
                dbContext.UserTaskProgresses.Add(new UserTaskProgress()
                {
                    UserId = user.Id,
                    TaskId = taskId
                });
            }
            
            dbContext.SaveChanges();
            return true;
        }
        
        return false;
    }
}


public class TaskDataValueComparer : IEqualityComparer<TaskData>
{
    public bool Equals(TaskData? x, TaskData? y)
    {
        if (ReferenceEquals(x, y)) return true;
        if (x is null || y is null) return false;
        return Equals(x.Value, y.Value);
    }

    public int GetHashCode(TaskData obj)
    {
        return obj.Value?.GetHashCode() ?? 0;
    }
}
