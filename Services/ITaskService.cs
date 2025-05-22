using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface ITaskService
{
    TaskResponse AddTask(HttpContext context, TaskRequest taskRequest);
    Task<TaskResponse> AddTaskAsync(HttpContext context, TaskRequest taskRequest);

    TaskResponse UpdateTask(HttpContext context, TaskRequest taskRequest);
    Task<TaskResponse> UpdateTaskAsync(HttpContext context, TaskRequest taskRequest);
    
    ICollection<TaskResponse> GetTasks(int userId, int cardId);
    Task<ICollection<TaskResponse>> GetTasksAsync(int userId, int cardId);
    
    bool DeleteTask(HttpContext context, int id);
    Task<bool> DeleteTaskAsync(HttpContext context, int id);
}
