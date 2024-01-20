defmodule Golf.Chat.ChatMessage do
  use Ecto.Schema
  import Ecto.Changeset

  schema "chat_messages" do
    field :topic, :string
    field :text, :string
    belongs_to :user, Golf.Users.User
    timestamps(type: :utc_datetime)
  end

  def changeset(chat_message, attrs \\ %{}) do
    chat_message
    |> cast(attrs, [:user_id, :topic, :text])
    |> validate_required([:user_id, :topic, :text])
  end

  def new(topic, user, text) do
    %__MODULE__{
      topic: topic,
      text: text,
      user_id: user.id,
      user: user
    }
  end
end
