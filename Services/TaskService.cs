using Crux.Data;
using Crux.Models.Entities;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace Crux.Services;

public class TaskService(ApplicationDbContext dbContext) : ITaskService
{
    public ICollection<TaskResponse> GetTasks(int userId, int cardId)
    {
        var card = dbContext.SandboxCards
            .Include(sc => sc.Tasks)
            .ThenInclude(t => t.ExpectedData)
            .FirstOrDefault(sc => sc.Id == cardId);
        
        if (card == null)
        {
            return [];
        }
        
        var tasksInfo = new List<TaskResponse>();

        foreach (var task in card.Tasks)
        {
            tasksInfo.Add(GetTaskInfo(userId, task)); 
        }
        
        return tasksInfo;
    }
    
    public async Task<ICollection<TaskResponse>> GetTasksAsync(int userId, int cardId)
    {
        var card = await dbContext.SandboxCards
            .Include(sc => sc.Tasks)
            .ThenInclude(t => t.ExpectedData)
            .FirstOrDefaultAsync(sc => sc.Id == cardId);
        
        if (card == null)
        {
            return [];
        }
        
        var tasksInfo = new List<TaskResponse>();

        foreach (var task in card.Tasks)
        {
            var taskInfo = await GetTaskInfoAsync(userId, task); 
            tasksInfo.Add(taskInfo);
        }
        
        return tasksInfo;
    }

    private TaskResponse GetTaskInfo(int userId, Models.Entities.Task task)
    {
        var isCompleted = dbContext.UserTaskProgresses.Any(progress => progress.UserId == userId
                                                                       && progress.TaskId == task.Id);

        return new TaskResponse
        {
            Success = true,
            Id = task.Id,
            Name = task.Name,
            Description = task.Description,
            Points = task.Points,
            IsCompleted = isCompleted
        };
    }
    
    private async Task<TaskResponse> GetTaskInfoAsync(int userId, Models.Entities.Task task)
    {
        var isCompleted = await dbContext.UserTaskProgresses.AnyAsync(progress => progress.UserId == userId
                                                                       && progress.TaskId == task.Id);

        return new TaskResponse
        {
            Success = true,
            Id = task.Id,
            Name = task.Name,
            Description = task.Description,
            Points = task.Points,
            IsCompleted = isCompleted
        };
    }

    public TaskResponse AddTask(TaskRequest taskRequest)
    {
        var sandboxCard = dbContext.SandboxCards.FirstOrDefault(sc => sc.Id == taskRequest.SandboxCardId);
        if (sandboxCard == null)
        {
            return new TaskResponse
            {
                Success = false, 
                Error = "Invalid Card Id"
            };
        }
        
        var task = new Models.Entities.Task
        {
            Name = taskRequest.Name,
            Description = taskRequest.Description,
            Points = taskRequest.Points,
            SandboxCardId = taskRequest.SandboxCardId,
            ExpectedData = new List<TaskData>()
        };
        
        dbContext.Tasks.Add(task);
        dbContext.SaveChanges(); 

        foreach (var item in taskRequest.ExpectedData)
        {
            var taskData = new TaskData
            {
                TaskId = task.Id,
                Value = item.Value
            };
            
            task.ExpectedData.Add(taskData);
        }
        
        dbContext.SaveChanges();

        return new TaskResponse
        {
            Success = true,
            Id = task.Id,
            Name = task.Name,
            Description = task.Description,
            Points = task.Points
        };
    }
    
    public async Task<TaskResponse> AddTaskAsync(TaskRequest taskRequest)
    {
        var sandboxCard = await dbContext.SandboxCards.FirstOrDefaultAsync(sc => sc.Id == taskRequest.SandboxCardId);
        if (sandboxCard == null)
        {
            return new TaskResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }
        
        var task = new Models.Entities.Task
        {
            Name = taskRequest.Name,
            Description = taskRequest.Description,
            Points = taskRequest.Points,
            SandboxCardId = taskRequest.SandboxCardId,
            ExpectedData = new List<TaskData>()
        };
        
        dbContext.Tasks.Add(task);
        await dbContext.SaveChangesAsync();

        foreach (var item in taskRequest.ExpectedData)
        {
            var taskData = new TaskData
            {
                TaskId = task.Id,
                Value = item.Value
            };
            
            task.ExpectedData.Add(taskData);
        }
        
        await dbContext.SaveChangesAsync();

        return new TaskResponse
        {
            Success = true,
            Id = task.Id,
            Name = task.Name,
            Description = task.Description,
            Points = task.Points
        };
    }

    public TaskResponse UpdateTask(TaskRequest taskRequest)
    {
        if (!taskRequest.Id.HasValue)
        {
            return new TaskResponse
            {
                Success = false, 
                Error = "Task Id not provided"
            };
        }
        
        var sandboxCard = dbContext.SandboxCards.FirstOrDefault(sc => sc.Id == taskRequest.SandboxCardId);
        if (sandboxCard == null)
        {
            return new TaskResponse
            {
                Success = false, 
                Error = "Invalid Card Id"
            };
        }
        
        var task = dbContext.Tasks
            .Include(t => t.ExpectedData)
            .FirstOrDefault(t => t.Id == taskRequest.Id.Value);
        
        if (task == null)
        {
            return new TaskResponse
            {
                Success = false, 
                Error = "Task not found"
            };
        }

        task.Name = taskRequest.Name;
        task.Description = taskRequest.Description;
        task.Points = taskRequest.Points;
        task.SandboxCardId = sandboxCard.Id;
        
        dbContext.TaskData.RemoveRange(task.ExpectedData);
        task.ExpectedData.Clear();

        foreach (var item in taskRequest.ExpectedData)
        {
            task.ExpectedData.Add(new TaskData
            {
                TaskId = task.Id, 
                Value = item.Value
            });
        }
    
        dbContext.SaveChanges();

        return new TaskResponse
        {
            Success = true,
            Id = task.Id,
            Name = task.Name,
            Description = task.Description,
            Points = task.Points
        };
    }
    
    public async Task<TaskResponse> UpdateTaskAsync(TaskRequest taskRequest)
    {
        if (!taskRequest.Id.HasValue)
        {
            return new TaskResponse 
            {
                Success = false, 
                Error = "Task Id not provided"
            };
        }
        
        var sandboxCard = await dbContext.SandboxCards.FirstOrDefaultAsync(sc => sc.Id == taskRequest.SandboxCardId);
        if (sandboxCard == null)
        {
            return new TaskResponse 
            {
                Success = false, 
                Error = "Invalid Card Id"
            };
        }
        
        var task = await dbContext.Tasks
            .Include(t => t.ExpectedData)
            .FirstOrDefaultAsync(t => t.Id == taskRequest.Id.Value);
        
        if (task == null)
        {
            return new TaskResponse 
            {
                Success = false,
                Error = "Task not found"
            };
        }

        task.Name = taskRequest.Name;
        task.Description = taskRequest.Description;
        task.Points = taskRequest.Points;
        task.SandboxCardId = sandboxCard.Id;
        
        dbContext.TaskData.RemoveRange(task.ExpectedData);
        task.ExpectedData.Clear();

        foreach (var item in taskRequest.ExpectedData)
        {
            task.ExpectedData.Add(new TaskData
            {
                TaskId = task.Id,
                Value = item.Value,
            });
        }
    
        await dbContext.SaveChangesAsync();

        return new TaskResponse
        {
            Success = true,
            Id = task.Id,
            Name = task.Name,
            Description = task.Description,
            Points = task.Points
        };
    }
    
    public bool DeleteTask(int id)
    {
        var task = dbContext.Tasks
            .Include(t => t.ExpectedData)
            .FirstOrDefault(t => t.Id == id);
        
        if (task != null)
        {
            dbContext.Tasks.Remove(task);
            dbContext.SaveChanges();
            return true;
        }
        
        return false;
    }
    
    public async Task<bool> DeleteTaskAsync(int id)
    {
        var task = await dbContext.Tasks
            .Include(t => t.ExpectedData)
            .FirstOrDefaultAsync(t => t.Id == id);
        
        if (task != null)
        {
            dbContext.Tasks.Remove(task);
            await dbContext.SaveChangesAsync();
            return true;
        }
        
        return false;
    }
}
