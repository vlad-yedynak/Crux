using Crux.Models;

namespace Crux.Services;

public class TestService : ITestService
{
    // TODO: Implement method to check if answer with answerId has questionId
    // TODO: and is correct. If true, add answer score to user's score and return true.
    public bool ValidateQuestion(HttpContext context, int questionId, int answerId)
    {
        throw new NotImplementedException();
    }

    // TODO: Implement method to check if task with taskId has same data as
    // TODO: input data. If true, add task score to user's score and return true.
    public bool ValidateTask(HttpContext context, int taskId, ICollection<TaskData> inputData)
    {
        throw new NotImplementedException();
    }
}

// TODO: Implement TestingController after finishing this service
