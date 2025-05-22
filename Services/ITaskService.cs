using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface ITaskService
{
    TaskResponse AddTask(TaskRequest taskRequest);
    Task<TaskResponse> AddTaskAsync(TaskRequest taskRequest);

    TaskResponse UpdateTask(TaskRequest taskRequest);
    Task<TaskResponse> UpdateTaskAsync(TaskRequest taskRequest);
    
    ICollection<TaskResponse> GetTasks(int userId, int cardId);
    Task<ICollection<TaskResponse>> GetTasksAsync(int userId, int cardId);
    
    bool DeleteTask(int id);
    Task<bool> DeleteTaskAsync(int id);
}
