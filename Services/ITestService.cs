using Crux.Models.Entities;

namespace Crux.Services;

public interface ITestService
{
    bool ValidateQuestion(HttpContext context, int questionId, int answerId);
    
    bool ValidateTask(HttpContext context, int taskId, ICollection<TaskData> inputData);
}
