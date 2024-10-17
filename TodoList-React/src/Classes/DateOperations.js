function GetDate(){
        let months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
        let day = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
        let date = new Date();
        let ObjectDateItem = { "Ano" : date.getFullYear(), "Mes" : [date.getMonth() + 1,months[date.getMonth()]], "Data" : date.getDate(), "Horas" : date.getHours(), "Minutos" : date.getMinutes(), "Segundos" : date.getSeconds(), "Dia" : day[date.getDay()]};
        return ObjectDateItem;
    }


export { GetDate }  