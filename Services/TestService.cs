using Crux.Data;
using Microsoft.EntityFrameworkCore;
using Crux.Models.Entities;

namespace Crux.Services;

public class TestService(
    ApplicationDbContext dbContext) : ITestService
{
    public bool ValidateQuestion(int userId, int questionId, int answerId)
    {
        var user =  dbContext.Users.FirstOrDefault(x => x.Id == userId);
        if (user == null)
        {
            return false;
        }
        
        var answer = dbContext.Answers.FirstOrDefault(x => x.Id == answerId &&  x.QuestionId == questionId);
        if (answer == null)
        {
            return false;
        }
        
        var question = dbContext.Questions.FirstOrDefault(x => x.Id == answer.QuestionId);
        if (question == null)
        {
            return false;
        }

        var card = dbContext.TestCards.FirstOrDefault(x => x.Id == question.TestCardId);
        if (card == null)
        {
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
    
    public async Task<bool> ValidateQuestionAsync(int userId, int questionId, int answerId)
    {
        var result = await dbContext.Answers
            .Where(a => a.Id == answerId && a.QuestionId == questionId)
            .Include(a => a.Question)
            .ThenInclude(q => q.TestCard)
            .Select(a => new
            {
                Answer = a,
                LessonId = a.Question.TestCard.LessonId,
                UserExists = dbContext.Users.Any(u => u.Id == userId),
                IsPreviouslyCompleted = dbContext.UserQuestionProgresses
                    .Any(p => p.UserId == userId && p.QuestionId == questionId),
                ExistingProgress = dbContext.UserLessonProgresses
                    .FirstOrDefault(p => p.UserId == userId && p.LessonId == a.Question.TestCard.LessonId)
            })
            .FirstOrDefaultAsync();

        if (result?.Answer == null || !result.UserExists)
            return false;

        if (result.Answer.IsCorrect && !result.IsPreviouslyCompleted)
        {
            if (result.ExistingProgress == null)
            {
                await dbContext.UserLessonProgresses.AddAsync(new UserLessonProgress
                {
                    UserId = userId,
                    LessonId = result.LessonId,
                    ScorePoint = result.Answer.Score
                });
            }
            else
            {
                result.ExistingProgress.ScorePoint += result.Answer.Score;
            }
        
            await dbContext.UserQuestionProgresses.AddAsync(new UserQuestionProgress
            {
                UserId = userId,
                QuestionId = questionId
            });
        
            await dbContext.SaveChangesAsync();
            return true;
        }
    
        return result.Answer.IsCorrect;
    }
    
    public bool ValidateTask(int userId, int taskId, ICollection<TaskData> inputData)
    {
        var user =  dbContext.Users.FirstOrDefault(x => x.Id == userId);
        
        if (user == null)
        {
            return false;
        }

        var task = dbContext.Tasks
            .Include(t => t.ExpectedData)
            .FirstOrDefault(t => t.Id == taskId);
        if (task == null)
        {
            return false;
        }
        
        var card = dbContext.SandboxCards.FirstOrDefault(x => x.Id == task.SandboxCardId);
        if (card == null)
        {
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
    
    public async Task<bool> ValidateTaskAsync(int userId, int taskId, ICollection<TaskData> inputData)
    {var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId);
        
        if (user == null)
        {
            return false;
        }

        var task = await dbContext.Tasks
            .Include(t => t.ExpectedData)
            .FirstOrDefaultAsync(t => t.Id == taskId);
        if (task == null)
        {
            return false;
        }
        
        var card = await dbContext.SandboxCards.FirstOrDefaultAsync(x => x.Id == task.SandboxCardId);
        if (card == null)
        {
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
