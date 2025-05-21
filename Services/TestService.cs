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
        
        var answer = dbContext.Answers.FirstOrDefault(x => x.Id == answerId &&  x.QuestionId == questionId);
        if (answer == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return false;
        }
        
        var question = dbContext.Questions.FirstOrDefault(x => x.Id == answer.QuestionId);
        if (question == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return false;
        }

        var card = dbContext.TestCards.FirstOrDefault(x => x.Id == question.TestCardId);
        if (card == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return false;
        }
        
        var isPreviouslyCompleted = dbContext.UserQuestionProgresses.Any(progress => progress.UserId == user.Id 
            && progress.QuestionId == questionId);

        if (answer.IsCorrect)
        {
            if (!isPreviouslyCompleted)
            {
                var scoreProgress = dbContext.UserLessonProgresses
                    .FirstOrDefault(p => p.UserId == user.Id && p.LessonId == card.LessonId);
                
                if (scoreProgress == null)
                {
                    dbContext.UserLessonProgresses.Add(new UserLessonProgress
                    {
                        UserId = user.Id,
                        LessonId = card.LessonId,
                        ScorePoint = answer.Score
                    });
                }
                else
                {
                    scoreProgress.ScorePoint += answer.Score;
                }
                
                dbContext.UserQuestionProgresses.Add(new UserQuestionProgress
                {
                    UserId = user.Id,
                    QuestionId = questionId
                });
            }
            
            dbContext.SaveChanges();
            return true;
        }
        
        return false;
    }
    
    public async Task<bool> ValidateQuestionAsync(HttpContext context, int questionId, int answerId)
    {
        var userId = await authenticationService.GetUserIdFromContextAsync(context);
        
        if (!userId.HasValue)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }
        
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId.Value);
        if (user == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return false;
        }
        
        var answer = await dbContext.Answers.FirstOrDefaultAsync(x => x.Id == answerId &&  x.QuestionId == questionId);
        if (answer == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return false;
        }
        
        var question = await dbContext.Questions.FirstOrDefaultAsync(x => x.Id == answer.QuestionId);
        if (question == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return false;
        }

        var card = await dbContext.TestCards.FirstOrDefaultAsync(x => x.Id == question.TestCardId);
        if (card == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return false;
        }
        
        var isPreviouslyCompleted = await dbContext.UserQuestionProgresses.AnyAsync(progress => progress.UserId == user.Id 
            && progress.QuestionId == questionId);

        if (answer.IsCorrect)
        {
            if (!isPreviouslyCompleted)
            {
                var scoreProgress = await dbContext.UserLessonProgresses
                    .FirstOrDefaultAsync(p => p.UserId == user.Id && p.LessonId == card.LessonId);
                
                if (scoreProgress == null)
                {
                    await dbContext.UserLessonProgresses.AddAsync(new UserLessonProgress
                    {
                        UserId = user.Id,
                        LessonId = card.LessonId,
                        ScorePoint = answer.Score
                    });
                }
                else
                {
                    scoreProgress.ScorePoint += answer.Score;
                }
                
                await dbContext.UserQuestionProgresses.AddAsync(new UserQuestionProgress
                {
                    UserId = user.Id,
                    QuestionId = questionId
                });
            }
            
            await dbContext.SaveChangesAsync();
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
        
        var card = dbContext.SandboxCards.FirstOrDefault(x => x.Id == task.SandboxCardId);
        if (card == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return false;
        }
        
        var isPreviouslyCompleted = dbContext.UserTaskProgresses.Any(progress => progress.UserId == user.Id 
            && progress.TaskId == taskId);

        if (task.ExpectedData.Count != inputData.Count)
        {
            return false;
        }
        
        var areEqual = task.ExpectedData.SequenceEqual(inputData, new TaskDataValueComparer());

        if (areEqual)
        {
            if (!isPreviouslyCompleted)
            {
                var scoreProgress = dbContext.UserLessonProgresses
                    .FirstOrDefault(p => p.UserId == user.Id && p.LessonId == card.LessonId);
                
                if (scoreProgress == null)
                {
                    dbContext.UserLessonProgresses.Add(new UserLessonProgress
                    {
                        UserId = user.Id,
                        LessonId = card.LessonId,
                        ScorePoint = task.Points
                    });
                }
                else
                {
                    scoreProgress.ScorePoint += task.Points;
                }
                
                dbContext.UserTaskProgresses.Add(new UserTaskProgress
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
    
    public async Task<bool> ValidateTaskAsync(HttpContext context, int taskId, ICollection<TaskData> inputData)
    {
        var userId = await authenticationService.GetUserIdFromContextAsync(context);
        
        if (!userId.HasValue)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }
        
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId.Value);
        
        if (user == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return false;
        }

        var task = await dbContext.Tasks
            .Include(t => t.ExpectedData)
            .FirstOrDefaultAsync(t => t.Id == taskId);
        if (task == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return false;
        }
        
        var card = await dbContext.SandboxCards.FirstOrDefaultAsync(x => x.Id == task.SandboxCardId);
        if (card == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return false;
        }
        
        var isPreviouslyCompleted = await dbContext.UserTaskProgresses.AnyAsync(progress => progress.UserId == user.Id 
            && progress.TaskId == taskId);

        if (task.ExpectedData.Count != inputData.Count)
        {
            return false;
        }
        
        var areEqual = task.ExpectedData.SequenceEqual(inputData, new TaskDataValueComparer());

        if (areEqual)
        {
            if (!isPreviouslyCompleted)
            {
                var scoreProgress = await dbContext.UserLessonProgresses
                    .FirstOrDefaultAsync(p => p.UserId == user.Id && p.LessonId == card.LessonId);
                
                if (scoreProgress == null)
                {
                    await dbContext.UserLessonProgresses.AddAsync(new UserLessonProgress
                    {
                        UserId = user.Id,
                        LessonId = card.LessonId,
                        ScorePoint = task.Points
                    });
                }
                else
                {
                    scoreProgress.ScorePoint += task.Points;
                }
                
                await dbContext.UserTaskProgresses.AddAsync(new UserTaskProgress
                {
                    UserId = user.Id,
                    TaskId = taskId
                });
            }
            
            await dbContext.SaveChangesAsync();
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
