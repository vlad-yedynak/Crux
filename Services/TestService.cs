using Crux.Data;
using Crux.Models;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics.CodeAnalysis;


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

        if (answer != null && answer.IsCorrect)
        {
            user.ScorePoints += answer.Score;
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

        if (task == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return false;
        }

        if (task.ExpectedData.Count != inputData.Count)
        {
            return false;
        }

        bool areEqual = task.ExpectedData.SequenceEqual(inputData, new TaskDataValueComparer());

        if (areEqual)
        {
            user.ScorePoints += task.Points;
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
        return object.Equals(x.Value, y.Value);
    }

    public int GetHashCode([DisallowNull] TaskData obj)
    {
        return obj.Value?.GetHashCode() ?? 0;
    }
}
