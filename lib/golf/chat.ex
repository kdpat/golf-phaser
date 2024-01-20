defmodule Golf.Chat do
  import Ecto.Query

  alias Golf.Repo
  alias Golf.Chat.ChatMessage

  def insert_message!(message) do
    message
    |> ChatMessage.changeset()
    |> Repo.insert!()
  end

  def get_messages(topic) do
    from(m in ChatMessage,
      where: [topic: ^topic],
      order_by: [asc: m.id]
    )
    |> Repo.all()
    |> Repo.preload(:user)
    |> Enum.map(fn msg -> Map.update!(msg, :inserted_at, &format_chat_time/1) end)
  end

  def format_chat_time(dt) do
    Calendar.strftime(dt, "%y/%m/%d %H:%m:%S")
  end
end
