using Crux.Models;

namespace Crux.Extensions;

public static class TaskExtensions
{
    public static void AddExpectedData<T>(this Models.Task task, T data)
    {
        var taskData = new ExpectedTaskData
        {
            TaskId = task.Id,
            Value = data
        };

        task.ExpectedData.Add(taskData);
    }

    public static void AddActualData<T>(this Models.Task task, T data)
    {
        var taskData = new ActualTaskData
        {
            TaskId = task.Id,
            Value = data
        };
            
        task.ActualData.Add(taskData);
    }
}
