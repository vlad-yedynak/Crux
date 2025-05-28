using Crux.Models.Entities;

namespace Crux.Services;

public interface ITestService
{
    bool ValidateQuestion(int userId, int questionId, int answerId);
    Task<bool> ValidateQuestionAsync(int userId, int questionId, int answerId);
    
    bool ValidateTask(int userId, int taskId, ICollection<TaskData> inputData);
    Task<bool> ValidateTaskAsync(int userId, int taskId, ICollection<TaskData> inputData);
}
